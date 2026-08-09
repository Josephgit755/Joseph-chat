const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/",(req, res)=>{
    res.json({
        message:"ZenvaZapp API is running",
    });

});

app.listen(PORT, "0.0.0.0",()=>{
    console.log(`ZenvaZapp server running on port ${PORT}`);
});