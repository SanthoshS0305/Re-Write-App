# MongoDB Shell (mongosh) Quick Reference

This guide shows you how to use `mongosh` to interact with your Re:Write database.

## Connecting to MongoDB

```bash
# Connect to local MongoDB
mongosh

# Connect to specific database
mongosh revision-history

# Connect to remote MongoDB (Atlas)
mongosh "mongodb+srv://cluster.mongodb.net/myDatabase" --apiVersion 1 --username <username>
```

## Basic Commands

```javascript
// Show all databases
show dbs

// Switch to revision-history database
use revision-history

// Show all collections
show collections

// Show current database
db

// Exit mongosh
exit
```

## Viewing Data

```javascript
// View all users
db.users.find()

// View all stories
db.stories.find()

// View all chapters
db.chapters.find()

// View all revisions
db.revisions.find()

// Pretty print (formatted output)
db.users.find().pretty()

// Limit results
db.stories.find().limit(5)

// Count documents
db.stories.countDocuments()
db.users.countDocuments()
```

## Filtering Data

```javascript
// Find user by email
db.users.findOne({ email: "demo@example.com" })

// Find stories by user ID
db.stories.find({ userId: ObjectId("...") })

// Find story by title
db.stories.findOne({ title: "My Story" })

// Find chapters for a story
db.chapters.find({ storyId: ObjectId("...") })

// Find revisions for a chapter
db.revisions.find({ chapterId: ObjectId("...") })
```

## Sorting and Limiting

```javascript
// Sort stories by creation date (newest first)
db.stories.find().sort({ createdAt: -1 })

// Get latest 5 revisions
db.revisions.find().sort({ createdAt: -1 }).limit(5)

// Get oldest chapter
db.chapters.find().sort({ createdAt: 1 }).limit(1)
```

## Aggregation Examples

```javascript
// Count stories per user
db.stories.aggregate([
  { $group: { _id: "$userId", count: { $sum: 1 } } }
])

// Count chapters per story
db.chapters.aggregate([
  { $group: { _id: "$storyId", chapterCount: { $sum: 1 } } }
])

// Count revisions per chapter
db.revisions.aggregate([
  { $group: { _id: "$chapterId", revisionCount: { $sum: 1 } } }
])
```

## Useful Queries for Debugging

```javascript
// Find all stories with their chapter count
db.stories.aggregate([
  {
    $lookup: {
      from: "chapters",
      localField: "_id",
      foreignField: "storyId",
      as: "chapters"
    }
  },
  {
    $project: {
      title: 1,
      chapterCount: { $size: "$chapters" }
    }
  }
])

// Find chapters with revision count
db.chapters.aggregate([
  {
    $lookup: {
      from: "revisions",
      localField: "_id",
      foreignField: "chapterId",
      as: "revisions"
    }
  },
  {
    $project: {
      title: 1,
      revisionCount: { $size: "$revisions" }
    }
  }
])

// Get total word count across all chapters
db.chapters.aggregate([
  {
    $group: {
      _id: null,
      totalWords: { $sum: "$wordCount" }
    }
  }
])
```

## Maintenance

```javascript
// Get database statistics
db.stats()

// Get collection statistics
db.stories.stats()

// Get indexes on a collection
db.users.getIndexes()

// Drop a collection (⚠️ BE CAREFUL!)
// db.collectionName.drop()

// Delete specific documents (⚠️ BE CAREFUL!)
// db.stories.deleteOne({ _id: ObjectId("...") })
```

## Backup and Restore

```bash
# Backup entire database
mongodump --db revision-history --out ./backup

# Restore entire database
mongorestore --db revision-history ./backup/revision-history

# Backup specific collection
mongodump --db revision-history --collection users --out ./backup

# Restore specific collection
mongorestore --db revision-history --collection users ./backup/revision-history/users.bson
```

## Tips

1. **Use Tab Completion**: Press `Tab` to autocomplete database/collection names
2. **Use `.pretty()`**: Makes JSON output more readable
3. **Use `.explain()`**: Shows query execution plan for optimization
4. **Use `.limit()`**: When testing queries, limit results to avoid overwhelming output
5. **Arrow Keys**: Navigate command history with up/down arrows

## Common Tasks

### Reset a User's Password

```javascript
// Find user
db.users.findOne({ email: "user@example.com" })

// You'll need to hash a new password in your backend code
// Then update:
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { password: "new-hashed-password" } }
)
```

### Delete All Revisions for a Chapter

```javascript
// Find chapter ID
db.chapters.findOne({ title: "Chapter 1" })

// Delete all its revisions
db.revisions.deleteMany({ chapterId: ObjectId("...") })
```

### Export Data to JSON

```bash
# Export stories to JSON file
mongoexport --db revision-history --collection stories --out stories.json --pretty

# Export users to JSON file
mongoexport --db revision-history --collection users --out users.json --pretty
```

### Import Data from JSON

```bash
# Import stories from JSON file
mongoimport --db revision-history --collection stories --file stories.json --jsonArray

# Import users from JSON file
mongoimport --db revision-history --collection users --file users.json --jsonArray
```

## Resources

- [MongoDB Shell Documentation](https://www.mongodb.com/docs/mongodb-shell/)
- [MongoDB Query Operators](https://www.mongodb.com/docs/manual/reference/operator/query/)
- [MongoDB Aggregation Pipeline](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/)

---

**Note**: Always be careful when running update/delete operations. Test with `find()` first, then use `updateOne()`/`deleteOne()` before using `updateMany()`/`deleteMany()`.

