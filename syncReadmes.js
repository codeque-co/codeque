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

syncHero()
syncEslintIntro()
syncFooters()
