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
const astUtils_1 = require("/astUtils");
const path_1 = __importDefault(require("path"));
const getFilesList_1 = require("/getFilesList");
describe('blocks', () => {
    let filesList = [];
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        filesList = yield (0, getFilesList_1.getFilesList)(path_1.default.resolve(__dirname, '__fixtures__'));
    }));
    it('should match exact whole block', () => {
        const queries = [
            `
      () => {
        toggleRTL();
        I18nManager.forceRTL(!isRTL);
        Updates.reloadAsync();
      }
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
        expect((0, astUtils_1.compareCode)(matches[0].code, queries[0])).toBeTruthy();
    });
    it('should match block using query without all statements and different order', () => {
        const queries = [
            `
      () => {
        Updates.reloadAsync();
        toggleRTL();
      }
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match block using query without all statements, but with order', () => {
        const queries = [
            `
      () => {
        toggleRTL();
        Updates.reloadAsync();
      }
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include-with-order',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
});
