import 'tailwindcss/tailwind.css'
import { UIState } from 'containers/ui'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect } from 'react'
import withDarkMode from 'next-dark-mode'
import classNames from 'classnames'

const handleRejection = (event: any) => {
  // react-beautiful-dnd 会捕获到 `ResizeObserver loop limit exceeded`
  // 但实际这个错误对性能没有影响
  // see https://github.com/atlassian/react-beautiful-dnd/issues/1548
  if (/^ResizeObserver/.test(event.message)) {
    // todo catch
    event.stopImmediatePropagation()
  }
  if (event.reason === 'canceled') {
    event.preventDefault()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', handleRejection)
  window.addEventListener('error', handleRejection)
}

function MyApp({
  Component,
  pageProps,
  darkMode,
}: AppProps & {
  darkMode: any
}) {
  useEffect(() => {
    if (darkMode?.darkModeActive) {
      document.querySelector('html')?.classList.add('dark')
    } else {
      document.querySelector('html')?.classList.remove('dark')
    }
  }, [darkMode?.darkModeActive])

  return (
    <div
      className={classNames({
        dark: darkMode?.darkModeActive,
      })}
    >
      <div className="bg-gray-50 text-gray-800">
        <UIState.Provider initialState={{ ua: pageProps?.ua }}>
          <DocumentHead />
          <Component {...pageProps} />
        </UIState.Provider>
      </div>
    </div>
  )

  function DocumentHead() {
    const { title } = UIState.useContainer()
    return (
      <Head>
        <title>{title.value}</title>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, height=device-height, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </Head>
    )
  }
}

export default withDarkMode(MyApp)
