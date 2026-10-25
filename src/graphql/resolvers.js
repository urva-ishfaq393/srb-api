// Resolvers contain no business logic: they call the SAME service functions
// that the REST controllers use (Question 3), so nothing is repeated.
const { GraphQLError } = require('graphql');
const roomService = require('../services/roomService');
const slotService = require('../services/slotService');
const studentService = require('../services/studentService');
const bookingService = require('../services/bookingService');
const AppError = require('../utils/AppError');

// Turn AppError (and mongoose errors) into a GraphQLError with a code
async function run(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AppError) {
      throw new GraphQLError(err.message, {
        extensions: { code: err.code || `HTTP_${err.status}`, status: err.status },
      });
    }
    if (err.name === 'ValidationError') {
      throw new GraphQLError('Validation failed', { extensions: { code: 'VALIDATION_FAILED', status: 422 } });
    }
    throw err;
  }
}

const withId = (s) => ({ ...s, id: String(s._id) });

const resolvers = {
  Query: {
    rooms: () => run(() => roomService.listRooms()),

    // The service pages results (max 100); the GraphQL query returns all matches
    slots: (_, { roomCode, date }) =>
      run(async () => {
        const all = [];
        let page = 1;
        let totalPages = 1;
        do {
          const res = await slotService.listSlots({ roomCode, date, page: String(page), limit: '100' });
          all.push(...res.data);
          totalPages = res.totalPages;
          page += 1;
        } while (page <= totalPages);
        return all.map(withId);
      }),

    student: (_, { regNo }) => run(() => studentService.getStudent(regNo)),
  },

  Student: {
    bookings: (student) => run(() => bookingService.listBookings(student.regNo)),
  },

  Mutation: {
    bookSlot: (_, { regNo, slotId }) => run(() => bookingService.createBooking(regNo, slotId)),

    cancelBooking: (_, { regNo, slotId }) =>
      run(async () => {
        const slot = await bookingService.cancelBooking(regNo, slotId);
        return slot ? withId(slotService.withSeatsLeft(slot)) : null;
      }),
  },
};

module.exports = resolvers;
