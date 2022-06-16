const cheerio = require('cheerio')
const fs = require('fs')
const moment = require('moment-timezone')

moment.locale('es-VE')

console.log('Starting...')

fs.rmdirSync('./output', { recursive: true })
fs.mkdirSync('./output')
fs.mkdirSync('./output/images')
fs.mkdirSync('./output/taxonomy')

const files = fs.readFileSync('files.txt', 'utf-8').split('\n').filter(Boolean)

let $
let numRec = 0
let numRecWithInfo = 0
let numFiles = 0
let content
let riskStats = {}
let taxonomy = {}

for (const file of files) {
  $ = cheerio.load(fs.readFileSync(file,{encoding:'utf8', flag:'r'}))
  extract(file)
  outputFile(file)
  if (content.imageUrlNoPrefix) {
    fs.copyFileSync('../fauna-archive/web/' + content.imageUrlNoPrefix, './output/' + content.imageUrlNoPrefix)
  }
  if (content.distributionMapUrlNoPrefix) {
    fs.copyFileSync('../fauna-archive/web/' + content.distributionMapUrlNoPrefix, './output/' + content.distributionMapUrlNoPrefix)
  }
}

fs.writeFileSync('./output/taxonomy/taxonomy.json', JSON.stringify(taxonomy, null, 2))
copyExtras()

console.log('Finished processing')
console.log('Files read:', numRec, 'Files with description:', numRecWithInfo, 'Files written:', numFiles)
console.log('Risk stats:', riskStats)

function copyExtras() {
  const filesToCopy = [
    'image-1.jpg',
    'image-2.jpg',
    'image-3.jpg',
    'image-4.jpg',
    'image-5.jpg',
    'image-6.jpg',
    'icon-arthropoda.svg',
    'icon-chordata.svg',
    'icon-cnidaria.svg',
    'icon-mollusca.svg',
    'casi-amenazado.png',
    'datos-insuficientes.png',
    'en-peligro-critico.png',
    'en-peligro.png',
    'extinto-a-nivel-regional.png',
    'extinto-en-estado-silvestre.png',
    'extinto.png',
    'no-aplicable.png',
    'no-evaluado.png',
    'preocupacion-menor.png',
    'vulnerable.png',
    'logo-provita.png',
    'logo-fundacion-empresas-polar.png',
    'provita-libro-rojo-fauna-venezolana-4ed-2015.zip'
  ]

  for (const f of filesToCopy) {
    fs.copyFileSync('../fauna-archive/web/images/' + f, './output/images/' + f)
  }
}

function outputFile(file) {
  if (Object.keys(content).length === 0) {
    // console.log('Content ignored:', file)
  } else {
    numFiles++
    let f = './output/' + file.split('/')[3].split('.')[0] + '.json'
    fs.writeFileSync(f, JSON.stringify(content, null, 2))
    collectTaxonomy(file)
  }
}

function collectTaxonomy(file) {

  if (!taxonomy[content.kingdom]) taxonomy[content.kingdom] = {}
  if (!taxonomy[content.kingdom][content.phylum]) taxonomy[content.kingdom][content.phylum] = {}
  if (!taxonomy[content.kingdom][content.phylum][content.class]) taxonomy[content.kingdom][content.phylum][content.class] = {}
  if (!taxonomy[content.kingdom][content.phylum][content.class][content.order]) taxonomy[content.kingdom][content.phylum][content.class][content.order] = {}
  if (!taxonomy[content.kingdom][content.phylum][content.class][content.order][content.family]) taxonomy[content.kingdom][content.phylum][content.class][content.order][content.family] = {}
  if (!taxonomy[content.kingdom][content.phylum][content.class][content.order][content.family][content.genus]) taxonomy[content.kingdom][content.phylum][content.class][content.order][content.family][content.genus] = {}

  taxonomy[content.kingdom][content.phylum][content.class][content.order][content.family][content.genus][content.species] = file.split('/')[3].split('.')[0] + '.json'

}

function addToContent(field, fieldContent) {
  if (fieldContent) {
    content[field] = fieldContent
  }
}

function extract(file) {
  content = {}
  numRec++

  addToContent('commonName', $('h2.mbr-section-title').text().trim())
  addToContent('scientificName', $('p:contains("Nombre científico:")').text().split(':').pop().trim())
  addToContent('binomialName', content.scientificName)
  addToContent('binomialNameAuthor', $('p:contains("Autoridad taxonómica:")').text().split(':').pop().trim())
  addToContent('taxonomyNotes', $('p:contains("Notas taxonómicas:")').text().split(':').pop().trim())
  addToContent('synonyms', $('p:contains("Sinónimos:")').text().split(':').pop().trim())
  addToContent('kingdom', 'Animalia')
  addToContent('phylum', $('p:contains("Phylum:")').text().split(':').pop().trim())
  addToContent('class', $('p:contains("Clase:")').text().split(':').pop().trim())
  addToContent('order', $('p:contains("Orden:")').text().split(':').pop().trim())
  addToContent('family', $('p:contains("Familia:")').text().split(':').pop().trim())
  addToContent('genus', $('p:contains("Género:")').text().split(':').pop().trim())
  addToContent('species', $('p:contains("Nombre científico:")').text().split(':').pop().trim())
  addToContent('risk', $('p:contains("Categoría:")').text().split(':').pop().trim())
  if (content.risk === undefined) {
    content.risk = 'Datos Insuficientes'
  }
  if (content.risk in riskStats) {
    riskStats[content.risk]++
  } else {
    riskStats[content.risk] = 1
  }
  addToContent('criteria', $('p:contains("Criterio:")').text().split('rio:').pop().trim())
  addToContent('commonNames', $('p:contains("Nombres comunes:")').next().html().trim())
  addToContent('description', $('p:contains("Descripción:")').next().next().html().trim().replace(/<a href=".*">/g, '').replace(/<\/a>/g, ''))
  if (content.description) numRecWithInfo++
  addToContent('distribution', $('p:contains("Distribución:")').next().next().html().trim().replace(/<a href=".*">/g, '').replace(/<\/a>/g, ''))
  addToContent('status', $('p:contains("Situación:")').next().next().html().trim().replace(/<a href=".*">/g, '').replace(/<\/a>/g, ''))
  addToContent('threats', $('p:contains("Amenazas:")').next().next().html().trim().replace(/<a href=".*">/g, '').replace(/<\/a>/g, ''))
  addToContent('conservation', $('p:contains("Conservación:")').next().next().html().trim().replace(/<a href=".*">/g, '').replace(/<\/a>/g, ''))
  addToContent('illustrator', $('p:contains("Ilustrador:")').text().split(':').pop().trim())
  addToContent('authors', $('p:contains("Autores:")').next().text().trim())
  addToContent('citation', $('blockquote>small').html().replace(/\s\s+/g, ' ').trim())
  addToContent('imageUrlNoPrefix', $('p>small:contains("Ilustrador: ")').parent().prev().find('a>img').attr('src'))
  addToContent('distributionMapUrlNoPrefix', $('br').next().find('a>img').attr('src'))

  addToContent('dateExtracted', new Date())

}
