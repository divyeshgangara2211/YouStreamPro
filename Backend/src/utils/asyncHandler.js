// It is a Higher order function means take function as input and also return function as output.

const asyncHandler = ( requestHandler ) => {
    return (req , res , next ) => {
        Promise
        .resolve( requestHandler(req , res , next ))
        .catch( (error) => next(error))
    }
}

export {asyncHandler }


// const asyncHandler = () => {}
// const asyncHandler = (func) => {() => {} }
// const asyncHandler = (func) => () => {} 
// const asyncHandler = (func) => async () => {}

//this is another method for asyncHandler with try catch.

// const asyncHandler = (func) => async (req , res , next ) => {
//     try {
//         return await func( req , res , next)
//     } catch (error) {
//         res.status( error.code || 500 ).json({
//             success : false ,
//             message : error.message
//         })
//     }
// }