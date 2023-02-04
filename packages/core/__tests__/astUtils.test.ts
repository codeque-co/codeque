import { compareCode } from './utils'
import { createWildcardUtils } from '/wildcardUtilsFactory'

describe('AST utils', () => {
  it('should compare code as equal', () => {
    const code1 = `
      import * as React from 'react';
      import { Paragraph, Button, Portal, Dialog, Colors } from 'react-native-paper';

      const DialogWithCustomColors = ({
        visible,
        close,
      }: {
        visible: boolean;
        close: () => void;
      }) => (
        <Portal>
          <Dialog
            onDismiss={close}
            style={{ backgroundColor: Colors.purple900 }}
            visible={visible}
          >
            <Dialog.Title style={{ color: Colors.white }}>Alert</Dialog.Title>
            <Dialog.Content>
              <Paragraph style={{ color: Colors.white }}>
                This is a dialog with custom colors
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button color={Colors.white} onPress={close}>OK</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      );

      export default DialogWithCustomColors;
    `

    const code2 = `
      import * as React from 'react';
      import { 
        Paragraph,
         Button, 
         Portal, 
         Dialog, 
         Colors 
        } from 'react-native-paper';

      const DialogWithCustomColors = ({
        visible,
        close,
      }: {
        visible: boolean;
        close: () => void;
      }) => (
        <Portal>
          <Dialog
            onDismiss={close}
            style={{ backgroundColor: Colors.purple900 }}
            visible={visible}
          >
            <Dialog.Title style={{ color: Colors.white }}>Alert</Dialog.Title>
            <Dialog.Content>
              <Paragraph style={{ color: Colors.white }}>This is a dialog with custom colors</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button color={Colors.white} onPress={close}>
                OK
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      );

      export default DialogWithCustomColors;
    `
    expect(compareCode(code1, code2)).toBeTruthy()
  })

  it('should compare code as unequal', () => {
    const code1 = `
      import * as React from 'react';
      import { Paragraph, Button, Portal, Dialog, Colors } from 'react-native-paper';

      const DialogWithCustomColors = ({
        visible,
        close,
      }: {
        visible: boolean;
        close: () => void;
      }) => (
        <Portal>
          <Dialog
            onDismiss={close}
            style={{ backgroundColor: Colors.purple900 }}
            visible={visible}
          >
            <Dialog.Title style={{ color: Colors.white }}>Alert</Dialog.Title>
            <Dialog.Content>
              <Paragraph style={{ color: Colors.white }}>
                This is a dialog with custom colors
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button color={Colors.white} onPress={close}>
                OK
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      );

      export default DialogWithCustomColors;
    `

    const code2 =
      // no Colors import

      `
      import * as React from 'react';
      import { 
        Paragraph, 
        Button, 
        Portal, 
        Dialog 
      } from 'react-native-paper';

      const DialogWithCustomColors = ({
        visible,
        close,
      }: {
        visible: boolean;
        close: () => void;
      }) => (
        <Portal>
          <Dialog
            onDismiss={close}
            style={{ backgroundColor: Colors.purple900 }}
            visible={visible}
          >
            <Dialog.Title style={{ color: Colors.white }}>Alert</Dialog.Title>
            <Dialog.Content>
              <Paragraph style={{ color: Colors.white }}>
                This is a dialog with custom colors
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button color={Colors.white} onPress={close}>
                OK
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      );

      export default DialogWithCustomColors;
    `
    expect(compareCode(code1, code2)).toBe(false)
  })

  it('should remove identifier ref from wildcard', () => {
    const identifierTypes: string[] = [] // not needed for this test
    const numericWildcard = '0x0'
    const wildcardChar = '$'
    const wildcardUtils = createWildcardUtils(
      identifierTypes,
      numericWildcard,
      wildcardChar,
    )

    expect(wildcardUtils.removeIdentifierRefFromWildcard('$$$_ref1')).toBe(
      '$$$',
    )

    expect(wildcardUtils.removeIdentifierRefFromWildcard('$$_ref1')).toBe('$$')

    expect(wildcardUtils.removeIdentifierRefFromWildcard('$$something')).toBe(
      '$$something',
    )

    expect(wildcardUtils.removeIdentifierRefFromWildcard('$$_something')).toBe(
      '$$',
    )

    expect(wildcardUtils.removeIdentifierRefFromWildcard('asd$$_ref')).toBe(
      'asd$$_ref',
    )

    // should not remove if ref is another wildcard
    expect(wildcardUtils.removeIdentifierRefFromWildcard('$$$_$$')).toBe(
      '$$$_$$',
    )

    // should not remove if ref is in the middle of string
    expect(wildcardUtils.removeIdentifierRefFromWildcard('$$$_notRef_$$')).toBe(
      '$$$_notRef_$$',
    )
  })
})
