import { ChakraProvider } from '@chakra-ui/react'
import { themeDark, themeLight } from './theme'
import { ThemeTypeProvider, ThemeTypeConsumer } from './useThemeType'

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeTypeProvider>
      <ThemeTypeConsumer>
        {(themeType) => {
          const theme = themeType === 'dark' ? themeDark : themeLight

          return <ChakraProvider theme={theme}>{children}</ChakraProvider>
        }}
      </ThemeTypeConsumer>
    </ThemeTypeProvider>
  )
}
