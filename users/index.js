const axios = require('axios');

async function getUsers() {
    const url = `${process.env.DATA_URL}/students`
    const response = await axios.get(url);
    return response.data;
}

async function deleteUser(id) {
    const url = `${process.env.DATA_URL}/students`
    const response = await axios.delete(`${url}/${id}`);
    return response.data
}

async function addUser (data) {
    const url = `${process.env.DATA_URL}/students`
    const response = await axios({
        method: "post",
        url: url,
        data: data,
        headers: {
            "Content-Type": "application/json"
        }
    })
    return response.data
}

async function detailUser (id) {
    const url = `${process.env.DATA_URL}/students/${id}`
    const response = await axios.get(url);
    return response.data;
}

async function updateUser (id, data) {
    const url = `${process.env.DATA_URL}/students/${id}`
    const response = await axios({
        method: "put",
        url: url,
        data: data,
        headers: {
            "Content-Type": "application/json"
        }
    })
    return response.data
}

module.exports = { getUsers, deleteUser, addUser, detailUser, updateUser };