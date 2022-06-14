"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const searchInFs_1 = require("/searchInFs");
const path_1 = __importDefault(require("path"));
const getFilesList_1 = require("/getFilesList");
describe('JSX', () => {
    let filesList = [];
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        filesList = yield (0, getFilesList_1.getFilesList)(path_1.default.resolve(__dirname, '__fixtures__'));
    }));
    it('Should find all imports including some keys with persisted order', () => {
        const query = `
      import {
        Button,
        IconButton
      } from 'react-native-paper'
    `;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [query]
        });
        expect(matches.length).toBe(1);
    });
    it('Should not find any imports including some keys when order changed', () => {
        const query = `
      import {
        IconButton,
        Button,
      } from 'react-native-paper'
    `;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include-with-order',
            filePaths: filesList,
            queryCodes: [query]
        });
        expect(matches.length).toBe(0);
    });
    it('Should find all imports of library', () => {
        const query = `
      import $$$ from 'react-native';
    `;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [query]
        });
        expect(matches.length).toBe(41);
    });
    it('Should find all default imports of a dependency', () => {
        const query = `
      import $$ from '../ScreenWrapper';
    `;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [query]
        });
        expect(matches.length).toBe(33);
    });
    it('Should find all default imports with case insensitive query', () => {
        const query = `
      import $$screenwrapper from '../screenwrapper';
    `;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            caseInsensitive: true,
            queryCodes: [query]
        });
        expect(matches.length).toBe(33);
    });
    it('Should find all aliased imports of a dependency', () => {
        const query = `
      import { Provider as $$ } from 'react-native-paper';
    `;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [query]
        });
        expect(matches.length).toBe(2);
    });
    it('Should find all imports with both default and named', () => {
        const query = `
      import $$, { $$$ } from '$$'; 
    `;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [query]
        });
        expect(matches.length).toBe(2);
    });
    it('Should find all aliased reexports ', () => {
        // TODO: fix - it matches "export {default} from " but it shouldn't
        const query = `
      export { $$ as $$$ } from '$$'; 
    `;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [query]
        });
        expect(matches.length).toBe(6);
    });
});
