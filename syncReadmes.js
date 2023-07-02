const fs = require('fs')
const path = require('path')
const cwd = process.cwd()
const mainReadmePath = path.join(cwd, 'Readme.md')
const cliReadmePath = path.join(cwd, '/packages/cli/README.md')
const coreReadmePath = path.join(cwd, '/packages/core/README.md')
const ESLintReadmePath = path.join(cwd, '/packages/eslint/README.md')
const vscodeReadmePath = path.join(cwd, '/packages/vscode/README.md')

const syncHero = () => {
  console.log('Syncing Hero intro')

  const pathsToUpdate = [
    mainReadmePath,
    cliReadmePath,
    coreReadmePath,
    ESLintReadmePath,
    vscodeReadmePath,
  ]

  const heroContentPath = path.join(cwd, 'readmePartials/hero.md')

  const heroContent = fs.readFileSync(heroContentPath).toString()

  pathsToUpdate.forEach((filePath) => {
    const content = fs.readFileSync(filePath).toString()

    const heroEndCommentLine = '<!-- HERO END -->'

    const contentAfterHero = content.split(heroEndCommentLine)[1]

    if (contentAfterHero) {
      const newContent = `${heroContent.trim()}

${contentAfterHero.trimStart()}`

      fs.writeFileSync(filePath, newContent)
      console.log('Saved', filePath.replace(cwd + '/', './'))
    } else {
      console.log('Hero location for', filePath, 'not found, skipping.')
    }
  })
}

const syncEslintIntro = () => {
  console.log('Syncing Eslint intro')
  const eslintIntroContentPath = path.join(cwd, 'readmePartials/eslintIntro.md')

  const eslintIntroContent = fs.readFileSync(eslintIntroContentPath).toString()

  const pathsToUpdate = [ESLintReadmePath, mainReadmePath]

  const eslintIntroStartComment = '<!-- ESLINT INTRO START -->'
  const eslintIntroEndComment = '<!-- ESLINT INTRO END -->'

  pathsToUpdate.forEach((filePath) => {
    const content = fs.readFileSync(filePath).toString()

    const contentBeforeEslintIntro = content.split(eslintIntroStartComment)[0]

    const contentAfterEslintIntro = content.split(eslintIntroEndComment)[1]

    const newContent = `${contentBeforeEslintIntro.trimEnd()}
  
${eslintIntroContent}

${contentAfterEslintIntro.trimStart()}`

    fs.writeFileSync(filePath, newContent)
    console.log('Saved', filePath.replace(cwd + '/', './'))
  })
}

const syncVscodeIntro = () => {
  console.log('Syncing VSCode intro')
  const vscodeIntroContentPath = path.join(cwd, 'readmePartials/vscodeIntro.md')

  const vscodeIntroContent = fs.readFileSync(vscodeIntroContentPath).toString()

  const pathsToUpdate = [vscodeReadmePath, mainReadmePath]

  const vscodeIntroStartComment = '<!-- VSCODE INTRO START -->'
  const vscodeIntroEndComment = '<!-- VSCODE INTRO END -->'

  pathsToUpdate.forEach((filePath) => {
    const content = fs.readFileSync(filePath).toString()

    const contentBeforeEslintIntro = content.split(vscodeIntroStartComment)[0]

    const contentAfterEslintIntro = content.split(vscodeIntroEndComment)[1]

    const newContent = `${contentBeforeEslintIntro.trimEnd()}
  
${vscodeIntroContent}

${contentAfterEslintIntro.trimStart()}`

    fs.writeFileSync(filePath, newContent)
    console.log('Saved', filePath.replace(cwd + '/', './'))
  })
}

const syncFooters = () => {
  console.log('Syncing footer')

  const pathsToUpdate = [
    mainReadmePath,
    cliReadmePath,
    coreReadmePath,
    ESLintReadmePath,
    vscodeReadmePath,
  ]

  const footerContentPath = path.join(cwd, 'readmePartials/footer.md')

  const footerContent = fs.readFileSync(footerContentPath).toString()

  pathsToUpdate.forEach((filePath) => {
    const content = fs.readFileSync(filePath).toString()

    const footerStartComment = '<!-- FOOTER START -->'

    const contentBeforeFooter = content.split(footerStartComment)[0]

    if (contentBeforeFooter) {
      const newContent = `${contentBeforeFooter.trimEnd()}

${footerContent.trimStart()}`

      fs.writeFileSync(filePath, newContent)
      console.log('Saved', filePath.replace(cwd + '/', './'))
    } else {
      console.log('Footer location for', filePath, 'not found, skipping.')
    }
  })
}

const addUtmSourceParams = () => {
  const pathsToUpdate = [
    { filePath: mainReadmePath, utmSource: 'readme_main' },
    { filePath: cliReadmePath, utmSource: 'readme_cli' },
    { filePath: coreReadmePath, utmSource: 'readme_core' },
    { filePath: ESLintReadmePath, utmSource: 'readme_eslint' },
    { filePath: vscodeReadmePath, utmSource: 'readme_vscode' },
  ]

  pathsToUpdate.forEach(({ filePath, utmSource }) => {
    let content = fs.readFileSync(filePath).toString()

    const linkRegExp = /"https:\/\/((codeque\.co)|(jayu\.dev)).*?"/g

    const links = [...new Set(content.match(linkRegExp))].filter(
      (link) => !link.includes('utm_source'),
    )

    console.log('links', links)

    links.forEach((link) => {
      const url = new URL(link.replace(/"/g, ''))

      url.searchParams.append('utm_source', utmSource)

      const newLink = `"${url.toString()}"`

      console.log(link, '->', newLink)

      content = content.replaceAll(link, newLink)
    })

    fs.writeFileSync(filePath, content)
  })
}

syncHero()
syncEslintIntro()
syncVscodeIntro()
syncFooters()
addUtmSourceParams()
