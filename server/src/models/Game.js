import mongoose from 'mongoose';

// Schema for group substructure
const groupSchema = new mongoose.Schema({
  isWolfGroup: {
    type: Boolean,
    default: false
  },
  playerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Friend'
  }],
  scorekeeperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Friend'
  }
}, { _id: false });

// Schema for raw scores
const playerScoreSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Friend'
  },
  holes: {
    type: Map,
    of: Number
  }
}, { _id: false });

// Schema for skins results
const skinSchema = new mongoose.Schema({
  hole: {
    type: Number,
    required: true
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Friend'
  },
  netScore: {
    type: Number
  },
  grossScore: {
    type: Number
  },
  isCTP: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Schema for scores object
const scoresSchema = new mongoose.Schema({
  raw: [playerScoreSchema],
  ctpWinner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Friend',
    default: null
  },
  skins: [skinSchema]
}, { _id: false });

// Main Game schema
const gameSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    default: ''
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  holes: {
    type: Number,
    default: 18,
    enum: [9, 18]
  },
  ctpHole: {
    type: Number,
    default: 2
  },
  entryFee: {
    type: Number,
    default: 10
  },
  signupDeadline: {
    type: Date,
    default: null
  },
  wolfEnabled: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'canceled'],
    default: 'upcoming'
  },
  groups: [groupSchema],
  scores: {
    type: scoresSchema,
    default: null
  }
}, { timestamps: true });

// Virtual field for ID (used for compatibility with current frontend)
gameSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Configure toJSON to include virtuals and exclude some fields
gameSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Index on date for faster lookups and sorting
gameSchema.index({ date: -1 });
gameSchema.index({ status: 1 });

const Game = mongoose.model('Game', gameSchema);

export default Game;
