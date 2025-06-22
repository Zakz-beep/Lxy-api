import express from "express"
import router from "./routes/router.js"
import routerUpload from "./routes/routerUpload.js"


const app = express()

app.use(express.json())
app.use('/uploads',express.static('uploads'))
app.use('/api/upload',routerUpload)

app.use('/',router)

app.listen(3000, () => {
        console.log('🦊 Server ready at http://localhost:3000')
    })