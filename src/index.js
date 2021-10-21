

const { attr } = require('cheerio/lib/api/attributes')
const {
  BaseKonnector,
  log,
  requestFactory,
  scrape,
  saveBills,
  saveFiles
} = require('cozy-konnector-libs')

let request = requestFactory()

request = requestFactory({
  // debug: true,
  cheerio: true,
  json: false,
  jar: true
})

const CozyBrowser = require('cozy-konnector-libs/dist/libs/CozyBrowser')

const baseUrl = 'https://monespaceprive.msa.fr'

const linkRole = []

const downloadLinks = []

const documents = []

module.exports = new BaseKonnector(start)
log('debug', 'hey')
async function start(fields) {
  await this.deactivateAutoSuccessfulLogin()

  // Authentification
  await authenticateThroughCheerio.bind(this)({
    login: fields.login,
    password: fields.password
  })
  // Choix du rôle
  if(fields.role === "Exploitant"){
    await exploitant(documents)

  }else if(fields.role === "Particulier") {
    await particulier()
  }else {
    log('err', "Veuillez entrer un role")
  }
}

async function authenticateThroughCheerio(form) {
  try {
    await request({ url: baseUrl + '/lfy/web/msa/accueil?modalId=2' })
    await request({ url: baseUrl + '/z84authmsa/wsrest/auth', method: 'POST', form })
    let $ = await request({ url: baseUrl + '/lfy/web/msa/accueil?p_p_id=connexionauthent_WAR_z80techrwdportlet&p_p_lifecycle=1&p_p_state=exclusive&p_p_mode=view&_connexionauthent_WAR_z80techrwdportlet_redirect=undefined' })
    const html = $.html()
    const start = html.indexOf('p_p_auth=')
    const end = html.substring(start).indexOf('"')
    const query = html.substring(start, start + end)
    $ = await request({ url: baseUrl + '/lfy/web/msa/accueil?' + query })
    $('a[href]').each(async function(index, link) {
      const href = link.attribs['href']
      linkRole.push(href)
  })}
  catch (error) {
        console.log(error)
    }}

async function exploitant(documents){
  let exploitantPage = await request({url: linkRole[1]})
  exploitantPage('a[href]').each(async function(i, link) {
    const href = link.attribs['href']
    if(href.includes('Z84CNSDOCNOT')) {
      // Liens de téléchargement directs
      const $ = await request({url: href})
      $('a[href]').each(async function(i, link) {
        const links = link.attribs['href']
        if(links.includes('DetailPdf')){
          downloadLinks.push(baseUrl + links)
        }
      })

      log('debug', typeof(downloadLinks[0]))

    for (let i = 0; i < downloadLinks.length; i++) {
      const doc = {
        "fileurl": `${downloadLinks[i]}`,
        "filename": `document${i}.pdf`,
      }
      documents.push(doc)
    }
    saveBills(documents, "/", {
      sourceAccount: "majelys",
      sourceAccountIdentifier: "majelys",
      identifier: ['MSA'],
      linkBankOperations: false,
    })
     log('info', documents)

    // Tableau des élements téléchargeables
    // const colCentre = docPage('table.ARRAY1>tbody>tr>td>table>tbody>tr>.COL_CENTRE')
    // const colGauche = docPage('table.ARRAY1>tbody>tr>td>table>tbody>tr>.COL_GAUCHE')



    }else{
      log('err', 'Lien non trouvé ...')
    }
  })


}



