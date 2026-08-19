import vuetify from 'eslint-config-vuetify'

export default vuetify({}, {
  rules: {
    'unicorn/no-this-outside-of-class': 'off',
    'unicorn/no-document-cookie': 'off',
    'unicorn/consistent-compound-words': 'off',
    'unicorn/no-array-sort': 'off',
    'vue/block-lang': 'off',
    'vue/custom-event-name-casing': 'off',
  },
})
