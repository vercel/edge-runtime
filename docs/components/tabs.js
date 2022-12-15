import { Tabs as NextraTabs, Tab } from 'nextra-theme-docs'
import useSWR from 'swr'

export { Tab }

const get = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch (e) {
    return null
  }
}

const set = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value)) && value

export function Tabs({ storageKey = 'tab-index', items, ...props }) {
  // Use SWR so all tabs with the same key can sync their states.
  const { data, mutate } = useSWR(storageKey, get)
  const selectedIndex = items.indexOf(data)

  return (
    <NextraTabs
      onChange={(index) => mutate(set(storageKey, items[index]), false)}
      selectedIndex={selectedIndex === -1 ? undefined : selectedIndex}
      items={items}
      {...props}
    />
  )
}
