const { BaseKonnector, log, requestFactory } = require('cozy-konnector-libs')

const request = requestFactory({
  cheerio: true,
  json: false,
  jar: true
})

const params = require('../konnector-dev-config.json')


const baseUrl = "https://monespaceprive.msa.fr/lfy/web/msa/accueil?modalId=2"

const coUrl = "https://monespaceprive.msa.fr/lfy/web/msa/accueil?modalId=2"

module.exports = new BaseKonnector(async function fetch(fields) {
  log('info', 'started')
  const $ = request(coUrl)

  log('debug', $)
  if (params) log('info', "Paramètres trouvés")

  await authenticate.bind(this)(fields.login, fields.password)

  const $accountPage = await login(fields)

})


async function authenticate(username, password) {
  return this.signin({
    url: coUrl,
    formSelector: 'form',
    formData: {username, password},
    validate: (statusCode,$ ,fullResponse) => {
      return fullResponse.request.uri.href === "https://monespaceprive.msa.fr/lfy/web/msa/espace-prive?modalId=5" || log('err', 'mauvais credentials')
    }
  })
}

async function login(fields){

  if(!fields.login.match(/^\d+$/)) {
    log('err', 'mauvais credentials')
    throw new Error('login failed')
  }
  log('info', 'connexion ...')
  await request(coUrl)
  const $req = await request({
    uri: coUrl,
    method: 'POST',
    form: {
      '_connexionauthent_WAR_z80techrwdportlet__58_login': fields.login,
      '_connexionauthent_WAR_z80techrwdportlet__58_password': fields.password
    }
  })
  //log('debug', $req.html())

  /* if(hasLogoutBtn($req)){
    return $req
  }else if ($req.html().includes('vérifiez votre identifiant et/ou votre mot de passe')){
    throw new Error('Problème login')
  }else {
    throw new Error('Autre problème')
  }
   */

}


