import Task from './model.js';
import { v4 as uuidv4 } from 'uuid';

class TaskDAO {
    // Create a new task
    async createTask(taskData) {
        try {
            const task = new Task({
                ...taskData,
                _id: taskData._id || `TASK-${uuidv4().substring(0, 8)}`,
                postDate: taskData.postDate || new Date(),
                status: taskData.status || 'pending',
                priority: taskData.priority || 'medium',
                orderRelated: taskData.orderRelated || false,
                progressDetails: taskData.progressDetails || [],
                items: taskData.items || [],
                outsourcing: taskData.outsourcing || false
            });
            return await task.save();
        } catch (error) {
            throw new Error(`Error creating task: ${error.message}`);
        }
    }

    // Get all tasks
    async getAllTasks() {
        try {
            return await Task.find({}).sort({ dueDate: 1 });
        } catch (error) {
            throw new Error(`Error fetching tasks: ${error.message}`);
        }
    }

    // Get task by ID
    async getTaskById(id) {
        try {
            return await Task.findById(id);
        } catch (error) {
            throw new Error(`Error finding task: ${error.message}`);
        }
    }

    // Get tasks by status
    async getTasksByStatus(status) {
        try {
            const validStatuses = ['pending', 'in progress', 'completed'];
            if (!validStatuses.includes(status)) {
                throw new Error('Invalid task status');
            }
            return await Task.find({ status }).sort({ dueDate: 1 });
        } catch (error) {
            throw new Error(`Error fetching tasks by status: ${error.message}`);
        }
    }

    // Get tasks by priority
    async getTasksByPriority(priority) {
        try {
            const validPriorities = ['low', 'medium', 'high'];
            if (!validPriorities.includes(priority)) {
                throw new Error('Invalid task priority');
            }
            return await Task.find({ priority }).sort({ dueDate: 1 });
        } catch (error) {
            throw new Error(`Error fetching tasks by priority: ${error.message}`);
        }
    }

    // Get tasks by assignee
    async getTasksByAssignee(assignedTo) {
        try {
            return await Task.find({ assignedTo }).sort({ dueDate: 1 });
        } catch (error) {
            throw new Error(`Error fetching tasks by assignee: ${error.message}`);
        }
    }

    // Get tasks by order number
    async getTasksByOrderNumber(orderNumber) {
        try {
            return await Task.find({
                orderRelated: true,
                orderNumber
            }).sort({ dueDate: 1 });
        } catch (error) {
            throw new Error(`Error fetching tasks by order number: ${error.message}`);
        }
    }

    // Get tasks by typeI
    async getTasksByTypeI(typeI) {
        try {
            const validTypeI = ['cutting', 'machining', 'plating', 'QC', 'tempering', 'shipping', 'other'];
            if (!validTypeI.includes(typeI)) {
                throw new Error('Invalid task typeI');
            }
            return await Task.find({ typeI }).sort({ dueDate: 1 });
        } catch (error) {
            throw new Error(`Error fetching tasks by typeI: ${error.message}`);
        }
    }

    // Get tasks by typeII
    async getTasksByTypeII(typeII) {
        try {
            const validTypeII = ['rework', 'add-on'];
            if (!validTypeII.includes(typeII)) {
                throw new Error('Invalid task typeII');
            }
            return await Task.find({ typeII }).sort({ dueDate: 1 });
        } catch (error) {
            throw new Error(`Error fetching tasks by typeII: ${error.message}`);
        }
    }

    // Get tasks by outsourcing status
    async getTasksByOutsourcing(isOutsourced) {
        try {
            return await Task.find({ outsourcing: isOutsourced }).sort({ dueDate: 1 });
        } catch (error) {
            throw new Error(`Error fetching tasks by outsourcing status: ${error.message}`);
        }
    }

    // Get tasks by outsourcing company
    async getTasksByOutsourcingCompany(outsourcingCompany) {
        try {
            return await Task.find({ outsourcingCompany }).sort({ dueDate: 1 });
        } catch (error) {
            throw new Error(`Error fetching tasks by outsourcing company: ${error.message}`);
        }
    }

    // Update task
    async updateTask(id, updateData) {
        try {
            const task = await Task.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            return task;
        } catch (error) {
            throw new Error(`Error updating task: ${error.message}`);
        }
    }

    // Mark task as completed
    async markTaskAsCompleted(id) {
        try {
            const task = await Task.findByIdAndUpdate(
                id,
                {
                    status: 'completed',
                    updatedAt: new Date()
                },
                { new: true }
            );
            return task;
        } catch (error) {
            throw new Error(`Error marking task as completed: ${error.message}`);
        }
    }

    // Add progress detail to task
    async addProgressDetail(id, progressDetail) {
        try {
            const task = await Task.findByIdAndUpdate(
                id,
                {
                    $push: {
                        progressDetails: {
                            date: progressDetail.date || new Date(),
                            description: progressDetail.description
                        }
                    },
                    updatedAt: new Date()
                },
                { new: true }
            );
            return task;
        } catch (error) {
            throw new Error(`Error adding progress detail: ${error.message}`);
        }
    }

    // Update progress detail
    async updateProgressDetail(id, progressIndex, progressDetail) {
        try {
            const task = await Task.findByIdAndUpdate(
                id,
                {
                    $set: {
                        [`progressDetails.${progressIndex}.date`]: progressDetail.date,
                        [`progressDetails.${progressIndex}.description`]: progressDetail.description
                    },
                    updatedAt: new Date()
                },
                { new: true }
            );
            return task;
        } catch (error) {
            throw new Error(`Error updating progress detail: ${error.message}`);
        }
    }

    // Remove progress detail
    async removeProgressDetail(id, progressIndex) {
        try {
            const task = await Task.findByIdAndUpdate(
                id,
                {
                    $unset: {
                        [`progressDetails.${progressIndex}`]: 1
                    },
                    $pull: {
                        progressDetails: null
                    },
                    updatedAt: new Date()
                },
                { new: true }
            );
            return task;
        } catch (error) {
            throw new Error(`Error removing progress detail: ${error.message}`);
        }
    }

    // Delete task
    async deleteTask(id) {
        try {
            const task = await Task.findByIdAndDelete(id);
            return task;
        } catch (error) {
            throw new Error(`Error deleting task: ${error.message}`);
        }
    }

    // Get tasks with pagination
    async getTasksPaginated(page = 1, limit = 10, filters = {}) {
        try {
            const skip = (page - 1) * limit;
            const query = Task.find(filters)
                .sort({ dueDate: 1 })
                .skip(skip)
                .limit(limit);

            const records = await query.exec();
            const total = await Task.countDocuments(filters);

            return {
                records,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Error fetching paginated tasks: ${error.message}`);
        }
    }
}

export default new TaskDAO();

