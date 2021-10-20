process.env.SENTRY_DSN =
  process.env.SENTRY_DSN ||
  'https://be591cf27cd348eeabc4d56b14bf12ac@sentry.cozycloud.cc/132'

const { BaseKonnector, utils, errors, log } = require('cozy-konnector-libs')
const firstGot = require('../libs/got')
const got = firstGot.extend({
  decompress: false
})
const courrierUrl = 'https://courriers.pole-emploi.fr'
const candidatUrl = 'https://candidat.pole-emploi.fr'
const loginUrl = 'https://monespaceprive.msa.fr/lfy/web/msa/accueil'
const { parse, subYears, format } = require('date-fns')
const gotScrape = require('../libs/scrape')

module.exports = new BaseKonnector(start)

async function start(fields) {
  await this.deactivateAutoSuccessfulLogin()
  await authenticate(fields)
  await this.notifySuccessfulLogin()

  const avisSituation = await fetchAvisSituation()
  await this.saveFiles([avisSituation], fields, {
    contentType: true,
    fileIdAttributes: ['vendorRef']
  })

  process.exit(0)
  const docs = await fetchCourriers()

  const filesWithBills = docs.filter(isFileWithBills)
  if (filesWithBills.length) {
    log('info', 'files with bills')
    await this.saveBills(filesWithBills, fields, {
      fileIdAttributes: ['vendorRef'],
      linkBankOperations: false,
      contentType: 'application/pdf',
      processPdf: parseAmountAndDate
    })
  }

  await this.saveFiles(docs, fields, {
    fileIdAttributes: ['vendorRef'],
    contentType: 'application/pdf'
  })
}

function isFileWithBills(doc) {
  return doc.type === 'Relevé de situation'
}

async function fetchAvisSituation() {
  return {
    fetchFile: async () => {
      // Mandatory requests to activate the download of Avis_de_situation
      const resp = await got(
        'https://candidat.pole-emploi.fr/candidat/situationadministrative/suiviinscription/attestation/mesattestations/true'
      )
      await got.post(candidatUrl + resp.$('#Formulaire').attr('action'), {
        form: {
          ...resp.getFormData('#Formulaire'),
          attestationsSelectModel: 'AVIS_DE_SITUATION'
        }
      })

      const link = `${candidatUrl}/candidat/situationadministrative/suiviinscription/attestation/recapitulatif:telechargerattestationpdf`
      const test = await got.head(link)
      if (test.url.includes('attestation/erreur')) {
        throw new Error('No avis de situation to fetch')
      }
      return got.stream(link)
    },
    shouldReplaceFile: () => true,
    filename: `${utils.formatDate(
      new Date()
    )}_polemploi_Dernier avis de situation.pdf`,
    vendorRef: 'AVIS_DE_SITUATION'
  }
}

async function fetchCourriers() {
  try {
    let resp = await got(
      'https://authentification-candidat.pole-emploi.fr/compte/redirigervers?url=https://courriers.pole-emploi.fr/courriersweb/acces/AccesCourriers'
    )

    resp = await got.post(resp.$('form').attr('action'), {
      form: resp.getFormData('form')
    })

    // get a maximum of files (minus 10 years)
    const form = resp.getFormData('form#formulaire')
    form.dateDebut = format(
      subYears(parse(form.dateDebut, 'dd/MM/yyyy', new Date()), 10),
      'dd/MM/yyyy'
    )

    resp = await got.post(
      courrierUrl + resp.$('form#formulaire').attr('action'),
      { form }
    )

    let docs = []
    while (resp) {
      const result = await getPage(resp)
      resp = result.nextResp
      docs = [...docs, ...result.docs]
    }
    return docs
  } catch (err) {
    if (err.response && err.response.statusCode === 500) {
      log('error', err.message)
      throw new Error(errors.VENDOR_DOWN)
    } else {
      throw err
    }
  }
}

async function getPage(resp) {
  const fetchFile = async doc =>
    got.stream(courrierUrl + (await got(doc.url)).$('iframe').attr('src'))
  const docs = resp
    .scrape(
      {
        date: {
          sel: '.date',
          parse: date =>
            date
              .split('/')
              .reverse()
              .join('-')
        },
        type: '.avisPaie',
        url: {
          sel: '.Telechar a',
          attr: 'href',
          parse: href => `${courrierUrl}${href}`
        },
        vendorRef: {
          sel: '.Telechar a',
          attr: 'href',
          parse: href => href.split('/').pop()
        }
      },
      'table tbody tr'
    )
    .map(doc => ({
      ...doc,
      fetchFile,
      filename: `${utils.formatDate(doc.date)}_polemploi_${doc.type}_${
        doc.vendorRef
      }.pdf`,
      vendor: 'Pole Emploi'
    }))

  const nextLink =
    '/courriersweb/mescourriers.bloclistecourriers.numerotation.boutonnext'
  const hasNext = Boolean(resp.$(`.pagination a[href='${nextLink}']`).length)
  let nextResp = false

  if (hasNext) nextResp = await got(courrierUrl + nextLink)

  return { docs, nextResp }
}

async function authenticate({ login, password }) {
  try {
    const state = {
      state: randomizeString(16),
      nonce: randomizeString(16)
    }

    log('debug', login )

    const creds = {
      login: login,
      password: password
    }

    const data = await got.post("https://monespaceprive.msa.fr/z84authmsa/wsrest/auth",
       creds
    )

    log('debug', "test:        " + data.body)
    let authBody = await got
      .post(
        loginUrl,
        {
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      )
      .json()

    authBody.callbacks[0].input[0].value = login

    authBody = await got
      .post(
        loginUrl,
        {
          json: authBody,
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      )
      .json()

    authBody.callbacks[1].input[0].value = password

    const zipCodeCb = authBody.callbacks.find(cb =>
      cb.output[0].value.includes('Code postal')
    )
    if (zipCodeCb) {
      if (!zipcode) {
        log('error', 'zipcode is missing and it is needed by pole emploi')
        throw new Error(errors.LOGIN_FAILED)
      }
      zipCodeCb.input[0].value = zipcode
    }
    authBody = await got
      .post(
        loginUrl,
        {
          json: authBody,
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      )
      .json()

    await got.defaults.options.cookieJar.setCookie(
      `idutkes=${authBody.tokenId}`,
      'https://authentification-candidat.pole-emploi.fr',
      {}
    )
    await got
      .post(
        'https://authentification-candidat.pole-emploi.fr/connexion/json/users?_action=idFromSession&realm=/individu',
        {
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      )
      .json()
  } catch (err) {
    if (err.response && err.response.statusCode === 401)
      throw new Error(errors.LOGIN_FAILED)
    else throw err
  }
}

// alg taken directly form the website
function randomizeString(e) {
  for (
    var t = [''],
      n = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-',
      r = 0;
    r < e;
    r++
  ) {
    t.push(n[Math.floor(Math.random() * n.length)])
  }
  return t.join('')
}

function parseAmountAndDate(entry, text) {
  // find date and amount lines in pdf
  const lines = text.split('\n')
  const dateLines = lines
    .map(line => line.match(/^REGLEMENT\sDU\s(.*)$/))
    .filter(Boolean)
  if (dateLines.length === 0) {
    log('warn', `found no paiment dates`)
  }
  const amountLines = lines
    .map(line => line.match(/^Règlement de (.*) euros par (.*)$/))
    .filter(Boolean)
  if (amountLines.length === 0) {
    log('warn', `found no paiment amounts`)
  }

  // generate bills data from it. We can multiple bills associated to one file
  const bills = []
  for (let i = 0; i < dateLines.length; i++) {
    const date = parse(dateLines[i].slice(1, 2).pop(), 'dd/MM/yyyy', new Date())
    const amount = parseFloat(
      amountLines[i]
        .slice(1, 2)
        .pop()
        .replace(',', '.')
    )
    if (date && amount) {
      bills.push({ ...entry, date, amount, isRefund: true })
    }
  }

  if (bills.length === 0) {
    // first bills is associated to the current entry
    entry.__ignore = true
    log('warn', 'could not find any date or amount in this document')
  } else {
    // next bills will generate a new entry associated to the same file
    Object.assign(entry, bills.shift())
    return bills
  }

  return entry
}
