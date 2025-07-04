class ApiResponse{
    constructor( statusCode , data  , message = "Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
};
//🔍 Usually, in REST APIs, the second argument is data, and it's expected to be an object, not a primitive value like a string or number.


export { ApiResponse }