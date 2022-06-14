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
const fs_1 = __importDefault(require("fs"));
describe('JSX', () => {
    let filesList = [];
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        filesList = yield (0, getFilesList_1.getFilesList)(path_1.default.resolve(__dirname, '__fixtures__'));
    }));
    const tempFilePath = path_1.default.join(__dirname, `${Date.now()}.temp`);
    const mockedFilesList = [tempFilePath];
    beforeAll(() => {
        fs_1.default.writeFileSync(tempFilePath, `
      <>
        <Flex >
      
            <Button
          >
              Press to 
              Download
            </Button>

        </Flex>

        <Button>
          Press to
          Download
        </Button>

        <Button>
          Click
          <Icon />
        </Button>
      </>
    `);
    });
    afterAll(() => {
        fs_1.default.unlinkSync(tempFilePath);
    });
    it('Should find all self-closing JSX', () => {
        const query = `<$$ />`;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [query]
        });
        expect(matches.length).toBe(148);
    });
    it('Should find JSX by tag name and prop', () => {
        const query = `
      <Drawer.Section title="Preferences">
      </Drawer.Section>
    `;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [query]
        });
        const resultCode = `
      <Drawer.Section title="Preferences">
        <TouchableRipple onPress={toggleTheme}>
          <View style={styles.preference}>
            <Text>Dark Theme</Text>
            <View pointerEvents="none">
              <Switch value={isDarkTheme} />
            </View>
          </View>
        </TouchableRipple>
        <TouchableRipple onPress={_handleToggleRTL}>
          <View style={styles.preference}>
            <Text>RTL</Text>
            <View pointerEvents="none">
              <Switch value={isRTL} />
            </View>
          </View>
        </TouchableRipple>
      </Drawer.Section>
    `;
        expect((0, astUtils_1.compareCode)(matches[0].code, resultCode)).toBeTruthy();
    });
    it('Should find JSX by prop name', () => {
        const query = `<$$ value={$$$} />`;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [query]
        });
        expect(matches.length).toBe(41);
    });
    it('Should find JSX by text content', () => {
        const query = `<Text>RTL</Text>`;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [query]
        });
        expect(matches.length).toBe(1);
    });
    it('Should find JSX by text content regardless formatting', () => {
        const query = `
      <Button>
        Press to 
        Download
      </Button>
    `;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockedFilesList,
            queryCodes: [query]
        });
        expect(matches.length).toBe(2);
    });
    it('Should find JSX by text content with wildcard case insensitive', () => {
        const query = `<Text>r$$L</Text>`;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [query],
            caseInsensitive: true
        });
        expect(matches.length).toBe(1);
    });
    it('Should find JSX by text content case insensitive', () => {
        const query = `<Text>rtl</Text>`;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            caseInsensitive: true,
            queryCodes: [query]
        });
        expect(matches.length).toBe(1);
    });
    it('Should find exact multiline JSX', () => {
        const query = `
      <View style={styles.preference}>
        <Text>Outlined</Text>
        <Switch
          value={isOutlined}
          onValueChange={() =>
            setIsOutlined((prevIsOutlined) => !prevIsOutlined)
          }
        />
      </View>
    `;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            queryCodes: [query]
        });
        expect((0, astUtils_1.compareCode)(matches[0].code, query)).toBeTruthy();
    });
    it('Should find components using useTheme() hook', () => {
        const usageQuery = `
      const $$$ = useTheme();
    `;
        const importQuery = `
      import {
        useTheme,
      } from 'react-native-paper';
    `;
        const { matches: resultsUsage } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [usageQuery]
        });
        const { matches: resultsImport } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [importQuery]
        });
        expect(resultsImport.length).not.toBe(0);
        expect(resultsImport.length).toBe(resultsUsage.length);
    });
    it('Should find all usages of component passed as a prop', () => {
        const query1 = `
      <$$$
        $$={() => (
          <IconButton />
        )}
      />
    `;
        const query2 = `
      <$$$
        $$={IconButton}
      />
    `;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [query1, query2]
        });
        expect(matches.length).toBe(2);
    });
    it('Should find all anonymous functions passed as a prop', () => {
        const queries = [
            `
      <$$$
        $$={() => $$$}
      />
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
        const firstResultCode = `
      <Drawer.Item {...props} key={props.key} theme={props.key === 3 ? {
        colors: {
          primary: Colors.tealA200
        }
      } : undefined} active={drawerItemIndex === index} onPress={() => _setDrawerItem(index)} 
      />
    `;
        expect(matches.length).toBe(190);
        expect((0, astUtils_1.compareCode)(matches[0].code, firstResultCode)).toBeTruthy();
    });
    it('Should find all anonymous functions passed as event listener handler', () => {
        const queries = [
            `
      <$$$
        on$$={() => $$$}
      />
    `,
            `
      <$$$
        on$$={() => $$$}
      >
      </$$$>
    `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        const firstResultCode = `
      <Drawer.Item {...props} key={props.key} theme={props.key === 3 ? {
        colors: {
          primary: Colors.tealA200
        }
      } : undefined} active={drawerItemIndex === index} onPress={() => _setDrawerItem(index)} 
      />
    `;
        expect(matches.length).toBe(164);
        expect((0, astUtils_1.compareCode)(matches[0].code, firstResultCode)).toBeTruthy();
    });
    it('Should find all Elements pretending to be a wrapper', () => {
        const queries = [
            `
      <$$Wrapper/>
    `,
            `
      <$$Wrapper>
      </$$Wrapper>
    `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(34);
    });
    it('Should find all title prop values which are strings', () => {
        const queries = [
            `
      <$$$ title="$$" />
    `,
            `
      <$$$ title="$$">
      </$$$>
    `,
            `
      <$$$ title={"$$"} />
    `,
            `
      <$$$ title={"$$"}>
      </$$$>
    `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(78);
    });
    it('Should ignore all empty JSXText in search', () => {
        const queries = [
            `
        <$$>
          $$
        </$$>;
    `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockedFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(3);
        expect((0, astUtils_1.compareCode)(matches[0].code, ` <Button>
          Press to 
          Download
        </Button>
      `)).toBeTruthy();
    });
    it('Should match code with nested JSX when using wildcard on text content', () => {
        const queries = [
            `
        <Button>
          c$$$
        </Button>;
    `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            caseInsensitive: true,
            filePaths: mockedFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
        expect((0, astUtils_1.compareCode)(matches[0].code, ` <Button>
        Click
        <Icon />
      </Button>
      `)).toBeTruthy();
    });
});
