

const asyncQuery = (sqlQuery) => {
    return new Promise((resolve, reject) => {

        try {
            connection.invokeQuery(sqlQuery, (result) => {
                resolve(result);
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {asyncQuery};