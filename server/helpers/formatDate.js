const formatDate = (dateString) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.getMonth()
    const year = date.getFullYear()
    return day + `-` + month + `-` + year
}

module.exports = formatDate