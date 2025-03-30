import mongoose from 'mongoose';

const signupSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Friend',
    required: true
  },
  wolf: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Create a compound index for gameId + playerId to ensure a player can only sign up once per game
signupSchema.index({ gameId: 1, playerId: 1 }, { unique: true });

// Index for faster lookups by game
signupSchema.index({ gameId: 1 });

// Virtual field for ID (used for compatibility with current frontend)
signupSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Configure toJSON to include virtuals and exclude some fields
signupSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Signup = mongoose.model('Signup', signupSchema);

export default Signup;
