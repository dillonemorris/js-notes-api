const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { AuthenticationError, ForbiddenError } = require('apollo-server-express')
require('dotenv').config()

const gravatar = require('../util/gravatar')

const Mutation = {
  newNote: async (parent, { content }, { models }) => {
    return await models.Note.create({
      content,
      author: 'Dillon Morris',
    })
  },
  deleteNote: async (parent, { id }, { models }) => {
    try {
      await models.Note.findOneAndRemove({ _id: id })
      return true
    } catch (err) {
      return false
    }
  },
  updateNote: async (parent, { id, content }, { models }) => {
    return await models.Note.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: {
          content,
        },
      },
      {
        new: true,
      }
    )
  },
  signUp: async (parent, { username, email, password }, { models }) => {
    const emailTrimmed = email.trim().toLowerCase()
    const hashedPassword = await bcrypt.hash(password, 10)
    const avatar = gravatar(email)

    try {
      const user = await models.User.create({
        avatar,
        username,
        email: emailTrimmed,
        password: hashedPassword,
      })

      return jwt.sign({ id: user._id }, process.env.JWT_SECRET)
    } catch (err) {
      console.log(err)

      throw new Error('Error creating the account')
    }
  },
  signIn: async (parent, { username, email, password }, { models }) => {
    if (email) {
      email = email.trim().toLowerCase()
    }

    const user = await models.User.findOne({
      $or: [{ email }, { username }],
    })

    if (!user) {
      throw new AuthenticationError('Error signing in')
    }

    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      throw new AuthenticationError('Error signing in')
    }

    return jwt.sign({ id: user._id }, process.env.JWT_SECRET)
  },
}

module.exports = Mutation
