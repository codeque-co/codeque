import { Command } from 'commander'
import { search } from './search'
import { createCliProgram } from './createCli'

const program = new Command()

createCliProgram(program)

program.parse(process.argv)
