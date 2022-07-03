import { Command } from 'commander'
import { createCliProgram } from './createCli'

const program = new Command()

createCliProgram(program)

program.parse(process.argv)
