module.exports = {
  // test database to use
  db: "mongodb://localhost/test",
  // if true, tests will use mockgoose instead of a real db
  // (this currently isn't working)
  useMockgoose: false,
  // if true, the db will be dropped upon connecting
  preDrop: true,
  // if true, the db will be dropped before disconnecting
  postDrop: false
}
