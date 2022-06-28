function MockURL(href) {
  if (!(this instanceof MockURL)) return new MockURL(href)
  this.href = href
}

module.exports.URL = MockURL
