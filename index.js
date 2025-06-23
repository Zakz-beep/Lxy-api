import express from "express"
import router from "./routes/router.js"
import routerUpload from "./routes/routerUpload.js"

import cors from "cors"
const app = express()
app.use(cors())
app.use(express.json())
app.use('/uploads',express.static('uploads'))
app.use('/api/upload',routerUpload)

app.use('/',router)

app.listen(3000, () => {
        console.log('🦊 Server ready at http://localhost:3000')
    })