import * as attendanceService from "../services/attendanceService.js";
import { sendError } from "../utils/appError.js";

export const fetchAllAttendance = async (req, res) => {
    try {
        res.status(200).json(await attendanceService.fetchAllAttendance());
    } catch (e) {
        sendError(res, e);
    }
};

export const punch = async (req, res) => {
    try {
        const { code, type } = req.body;
        res.status(200).json(await attendanceService.punch(code, type));
    } catch (e) {
        sendError(res, e);
    }
};
