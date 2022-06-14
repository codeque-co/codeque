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
describe('Other', () => {
    let filesList = [];
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        filesList = yield (0, getFilesList_1.getFilesList)(path_1.default.resolve(__dirname, '__fixtures__'));
    }));
    it('should not include the same result twice', () => {
        const queries = [
            `
      type $$ = ScrollViewProps & $$$
      `,
            `
       type $$ = $$$ & ScrollViewProps
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should not include the same result twice 2', () => {
        const queries = [
            `
      <$$$
        $$={() => {}}
      />
    `,
            `
      <$$$
        $$={() => $$$}
      />
    `,
            `
      <$$$
        $$={() => {}}
      >
      </$$$>
    `,
            `
      <$$$
        $$={() => $$$}
      >
      </$$$>
    `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(190);
    });
});
