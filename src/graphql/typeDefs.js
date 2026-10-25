const typeDefs = `#graphql
  type Room {
    roomCode: String!
    name: String!
    building: String!
    seats: Int!
  }

  type Slot {
    id: ID!
    roomCode: String!
    date: String!
    startHour: Int!
    seats: Int!
    booked: Int!
    seatsLeft: Int!
  }

  type Booking {
    bookingId: ID!
    slotId: ID!
    roomCode: String!
    roomName: String!
    building: String!
    date: String!
    startHour: Int!
  }

  type Student {
    regNo: String!
    name: String!
    email: String!
    bookings: [Booking!]!
  }

  type Query {
    rooms: [Room!]!
    slots(roomCode: String, date: String): [Slot!]!
    student(regNo: String!): Student
  }

  type Mutation {
    bookSlot(regNo: String!, slotId: ID!): Booking!
    cancelBooking(regNo: String!, slotId: ID!): Slot
  }
`;

module.exports = typeDefs;
