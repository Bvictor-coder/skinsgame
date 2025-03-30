import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true
  },
  handicap: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create an index on email for faster lookups
friendSchema.index({ email: 1 });

// Virtual field for ID (used for compatibility with current frontend)
friendSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Configure toJSON to include virtuals and exclude some fields
friendSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Friend = mongoose.model('Friend', friendSchema);

export default Friend;
