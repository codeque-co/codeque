// theme.ts

// 1. import `extendTheme` function
import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

// 2. Add your color mode config
const configDark: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false
}

const configLight: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false
}

// 3. extend the theme
export const themeDark = extendTheme({ config: configDark })

export const themeLight = extendTheme({ config: configLight })
