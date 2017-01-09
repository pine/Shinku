require('./index').handler(null, null, (err, data) => {
  if (err) {
    console.error(err)
    console.log(data)
  } else {
    console.log(data)
  }
})
