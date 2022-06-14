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
const getFilesList_1 = require("/getFilesList");
const path_1 = __importDefault(require("path"));
const searchInFs_1 = require("/searchInFs");
const dedent_1 = __importDefault(require("dedent"));
describe('Text search mode', () => {
    let filesList = [];
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        filesList = yield (0, getFilesList_1.getFilesList)(path_1.default.resolve(__dirname, '__fixtures__'));
    }));
    it('should perform basic text search', () => {
        const results = (0, searchInFs_1.searchInFileSystem)({
            queryCodes: [`const $$ = use$$(`],
            filePaths: filesList,
            mode: 'text'
        });
        expect(results.matches.length).toBe(7);
        expect(results.matches[0].code).toBe('const { colors } = useTheme(');
    });
    it('Should match code with optional single line wildcard which exist', () => {
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            queryCodes: [
                (0, dedent_1.default) `
        <Avatar.Text $$ label="XD" />
        `
            ],
            filePaths: filesList,
            mode: 'text'
        });
        expect(matches).toHaveLength(1);
    });
    it('Should match code with optional single line wildcard which not exist', () => {
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            queryCodes: [
                (0, dedent_1.default) `
        <Avatar.Text style={styles.avatar} label="XD" $$ />
        `
            ],
            filePaths: filesList,
            mode: 'text'
        });
        expect(matches).toHaveLength(2);
    });
    it('Should match code with optional multi line wildcard which exist', () => {
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            queryCodes: [
                (0, dedent_1.default) `
        <Avatar.Text
          $$m
          color={Colors.black}
        />
        `
            ],
            filePaths: filesList,
            mode: 'text'
        });
        expect(matches).toHaveLength(2);
    });
    it('Should match code with optional multi line wildcard which not exist', () => {
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            queryCodes: [
                (0, dedent_1.default) `
        <Avatar.Icon
          style={[styles.avatar, { backgroundColor: Colors.yellow500 }]}
          icon="folder" $$m
          color={Colors.black}
        />
        `
            ],
            filePaths: filesList,
            mode: 'text'
        });
        expect(matches).toHaveLength(1);
    });
    it('Should match code with required single line wildcard which exist', () => {
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            queryCodes: [
                (0, dedent_1.default) `
        <Avatar.Text $$$ label="XD" />
        `
            ],
            filePaths: filesList,
            mode: 'text'
        });
        expect(matches).toHaveLength(1);
    });
    it('Should not match code with required single line wildcard which not exist', () => {
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            queryCodes: [
                (0, dedent_1.default) `
        <Avatar.Text style={sty$$$les.avatar} label="XD" />
        `
            ],
            filePaths: filesList,
            mode: 'text'
        });
        expect(matches).toHaveLength(0);
    });
    it('Should match code with required multi line wildcard which exist', () => {
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            queryCodes: [
                (0, dedent_1.default) `
        <Avatar.$$$
          style={[styles.av$$$m
          color={Colors.black}
        />
        `
            ],
            filePaths: filesList,
            mode: 'text'
        });
        expect(matches).toHaveLength(2);
    });
    it('Should not match code with required multi line wildcard which not exist', () => {
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            queryCodes: [
                (0, dedent_1.default) `
        <Avatar.Icon
          style={[styles.$$$mavatar, { backgroundColor: Colors.yellow500 }]}
          icon="folder"$$$m
          color={Colors.black}
        />
        `
            ],
            filePaths: filesList,
            mode: 'text'
        });
        expect(matches).toHaveLength(0);
    });
    it('Should match space agnostic code', () => {
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            queryCodes: [
                (0, dedent_1.default) `
        <  Avatar.Text


          style={   [styles.   avatar, { 
            backgroundColor: Colors.yellow500 }]}
              label   =   "XD"
          
              color={Colors.black}
        />
        `
            ],
            filePaths: filesList,
            mode: 'text'
        });
        expect(matches).toHaveLength(1);
    });
});
