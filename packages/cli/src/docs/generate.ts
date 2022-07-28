import fs from 'fs'

import template from './template'
import { createCliProgram } from '../createCli'

export type Command = {
  isRoot: boolean
  name: string
  arguments: {
    nameRaw: string
    name: string
    required: boolean
    description?: string
  }[]
  description?: string
  options: {
    shortName: string
    longName?: string
    argument?: string
    description?: string
    defaultValue?: string
    required: boolean
  }[]
}

function createCommandsInspector() {
  let currentCommand: Command | null = null
  const commands: Command[] = []
  const parseOption = (
    data: string,
    description: string,
    defaultValue: string,
    required: boolean,
  ) => {
    const argRegex = /(<|\[).+?(>|\])/g
    const argument = data.match(argRegex)
    const [shortName, longName] = data
      .replace(argRegex, '')
      .trim()
      .split(/,\s+/)

    return {
      shortName,
      longName,
      argument:
        argument !== null && argument.length > 0 ? argument[0] : undefined,
      description,
      defaultValue,
      required,
    }
  }

  return {
    root(args: string[]) {
      if (currentCommand !== null) {
        commands.push(currentCommand)
      }

      currentCommand = {
        isRoot: true,
        name: '',
        arguments: args.map((arg) => ({
          nameRaw: arg,
          name: arg.substring(1, arg.length - 1),
          required: arg.charAt(0) === '<',
        })),
        options: [],
      }

      return this
    },
    command(cmd: string) {
      if (currentCommand !== null) {
        commands.push(currentCommand)
      }

      const [name, ...args] = cmd.split(/\s+/)

      currentCommand = {
        name,
        isRoot: false,
        arguments: args.map((arg) => ({
          nameRaw: arg,
          name: arg.substring(1, arg.length - 1),
          required: arg.charAt(0) === '<',
        })),
        options: [],
      }

      return this
    },
    description(description: string, argDescription?: Record<string, string>) {
      if (currentCommand !== null) {
        currentCommand.description = description

        if (argDescription !== undefined) {
          currentCommand.arguments.forEach((arg) => {
            //eslint-disable-next-line
            if (argDescription.hasOwnProperty(arg.name)) {
              arg.description = argDescription[arg.name]
            }
          })
        }
      }

      return this
    },
    option(data: string, description: string, defaultValue: string) {
      if (currentCommand !== null) {
        currentCommand.options.push(
          parseOption(data, description, defaultValue, false),
        )
      }

      return this
    },
    requiredOption(data: string, description: string, defaultValue: string) {
      if (currentCommand !== null) {
        currentCommand.options.push(
          parseOption(data, description, defaultValue, true),
        )
      }

      return this
    },
    action() {
      return this
    },
    getCommands() {
      if (currentCommand !== null) {
        commands.push(currentCommand)
      }

      return commands
    },
  }
}

function generate(output: string, initialHeaderLevel = 3) {
  const commandInspector = createCommandsInspector()
  commandInspector.root([])
  //@ts-ignore
  createCliProgram(commandInspector)
  const commands = commandInspector.getCommands()

  const document = template(commands, initialHeaderLevel)

  fs.writeFileSync(output, document)
}

export default generate
