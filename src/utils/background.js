/* global __APP_VERSION__ */
import { computed, ref } from 'vue'

const backgrounds = import.meta.glob('@/assets/background.*.webp', {
  eager: true,
  import: 'default',
})
const bgList = Object.values(backgrounds)
const initialIndex = bgList.length > 0 ? Math.floor(Math.random() * bgList.length) : -1
const currentIndex = ref(initialIndex)

export function setBackgroundImage () {
  const currentBgUrl = computed(() => {
    if (currentIndex.value >= 0 && currentIndex.value < bgList.length) {
      return bgList[currentIndex.value]
    }
    return ''
  })

  const backgroundImage = computed(() => {
    if (!currentBgUrl.value) {
      return 'none'
    }
    return `url("${currentBgUrl.value}?v=${__APP_VERSION__}")`
  })

  const changeBackgroundImage = () => {
    if (bgList.length <= 1) {
      return
    }
    let nextIndex
    do {
      nextIndex = Math.floor(Math.random() * bgList.length)
    } while (nextIndex === currentIndex.value)
    currentIndex.value = nextIndex
  }

  return {
    bgList,
    currentIndex,
    currentBgUrl,
    backgroundImage,
    changeBackgroundImage,
  }
}
