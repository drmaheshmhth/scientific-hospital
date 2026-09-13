const express = require("express");
require("dotenv").config();
const fs = require("fs");
const session = require("express-session");

const app = express();
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

const PORT = 3000;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function requireAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect("/admin.html");
    }
}
app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/admin.html");
    });
});
app.get("/admin-dashboard.html", requireAdmin, (req, res) => {
    res.sendFile(__dirname + "/admin-dashboard.html");
});

app.use(express.static(__dirname));

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;

        return res.json({
            success: true,
            message: "Login successful"
        });
    }

    res.json({
        success: false,
        message: "Invalid username or password"
    });
});
app.get("/api/appointments", requireAdmin, (req, res) => {
    const fileData = fs.readFileSync("appointments.json", "utf8");
    const appointments = JSON.parse(fileData);

    res.json(appointments);
});
app.post("/api/appointments", (req, res) => {
    console.log("New Appointment:", req.body);

    const fileData = fs.readFileSync("appointments.json", "utf8");
    const appointments = JSON.parse(fileData);

    const newAppointment = {
        id: Date.now(),
        ...req.body,
        status: "New"
    };

    appointments.push(newAppointment);

    fs.writeFileSync(
        "appointments.json",
        JSON.stringify(appointments, null, 2)
    );

    res.json({
        success: true,
        message: "OPD Appointment booked successfully!"
    });
});
app.patch("/api/appointments/:id", requireAdmin, (req, res) => {
  
    const fileData = fs.readFileSync("appointments.json", "utf8");
    const appointments = JSON.parse(fileData);

    const id = Number(req.params.id);
    const appointment = appointments.find(item => item.id === id);

    if (!appointment) {
        return res.status(404).json({
            success: false,
            message: "Appointment not found"
        });
    }

    appointment.status = req.body.status;

    fs.writeFileSync(
        "appointments.json",
        JSON.stringify(appointments, null, 2)
    );

    res.json({
        success: true,
        message: "Appointment status updated"
    });
});
app.delete("/api/appointments/:id", requireAdmin, (req, res) => {
    const fileData = fs.readFileSync("appointments.json", "utf8");
    const appointments = JSON.parse(fileData);

    const id = Number(req.params.id);

    const newAppointments = appointments.filter(
        appointment => appointment.id !== id
    );

    if (newAppointments.length === appointments.length) {
        return res.status(404).json({
            success: false,
            message: "Appointment not found"
        });
    }

    fs.writeFileSync(
        "appointments.json",
        JSON.stringify(newAppointments, null, 2)
    );

    res.json({
        success: true,
        message: "Appointment deleted successfully"
    });
});
app.get("/api/reviews", (req, res) => {
    const fileData = fs.readFileSync("reviews.json", "utf8");
    const reviews = JSON.parse(fileData);

    res.json(reviews);
});
app.post("/api/reviews", (req, res) => {
    const { patientName, rating, review } = req.body;

    if (!patientName || !rating || !review) {
        return res.json({
            success: false,
            message: "Please fill all fields"
        });
    }

    const fileData = fs.readFileSync("reviews.json", "utf8");
    const reviews = JSON.parse(fileData);

    const newReview = {
        id: Date.now(),
        patientName,
        rating,
        review,
        status: "New"
    };

    reviews.push(newReview);

    fs.writeFileSync(
        "reviews.json",
        JSON.stringify(reviews, null, 2)
    );

    res.json({
        success: true,
        message: "Thank you! Your review has been submitted."
    });
});
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
});