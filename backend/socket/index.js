const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

module.exports = (io) => {
    // Middleware for Socket.io to authenticate user
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            socket.user = decoded;
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected to socket: ${socket.user.id}`);

        socket.on('join_room', async ({ bookingId }) => {
            try {
                // Validate if the user is part of the booking
                const [bookings] = await pool.query(
                    'SELECT user_id, agent_id, status FROM bookings WHERE id = ?',
                    [bookingId]
                );

                if (bookings.length === 0) {
                    return socket.emit('error', 'Booking not found');
                }

                const booking = bookings[0];

                if (socket.user.id !== booking.user_id && socket.user.id !== booking.agent_id) {
                    return socket.emit('error', 'Not authorized to join this chat');
                }

                const roomName = `booking_${bookingId}`;
                socket.join(roomName);
                console.log(`User ${socket.user.id} joined room ${roomName}`);
            } catch (error) {
                console.error('Join room error:', error);
                socket.emit('error', 'Failed to join room');
            }
        });

        socket.on('send_message', async (data) => {
            const { bookingId, message } = data;
            
            if (!bookingId || !message) {
                return;
            }

            try {
                // Optional: Re-verify authorization and booking status
                const [bookings] = await pool.query(
                    'SELECT user_id, agent_id, status FROM bookings WHERE id = ?',
                    [bookingId]
                );

                if (bookings.length === 0) return;
                const booking = bookings[0];

                // Check authorization
                if (socket.user.id !== booking.user_id && socket.user.id !== booking.agent_id) return;

                // Restrict chat if not accepted or in_progress. Optional step (can also allow for past bookings if requested, but requirement says "Enable chat ONLY when booking status = accepted / in_progress")
                if (!['accepted', 'in_progress'].includes(booking.status)) {
                    socket.emit('error', 'Chat is only active for accepted or in-progress bookings.');
                    return;
                }

                // Save to database
                const [result] = await pool.query(
                    'INSERT INTO messages (booking_id, sender_id, message) VALUES (?, ?, ?)',
                    [bookingId, socket.user.id, message]
                );

                // Fetch sender info to echo back
                const [users] = await pool.query('SELECT name, role FROM users WHERE id = ?', [socket.user.id]);
                const senderName = users[0]?.name || 'Unknown';
                const senderRole = users[0]?.role || 'user';

                const newMessage = {
                    id: result.insertId,
                    booking_id: bookingId,
                    sender_id: socket.user.id,
                    message,
                    created_at: new Date(),
                    sender_name: senderName,
                    sender_role: senderRole
                };

                // Emit to the room
                io.to(`booking_${bookingId}`).emit('receive_message', newMessage);
            } catch (error) {
                console.error('Send message error:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected from socket: ${socket.user.id}`);
        });
    });
};
