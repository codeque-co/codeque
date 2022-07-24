// eslint-disable-next-line
export function simpleDebounce<F extends (...args: any) => unknown>(func: F, timeout = 300) {
  let timer: NodeJS.Timeout

  return (...args: Parameters<F>) => {
    clearTimeout(timer)

    timer = setTimeout(() => {
      //@ts-ignore
      func.apply(this, args)
    }, timeout)
  }
}
