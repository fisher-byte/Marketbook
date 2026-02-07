/**
 * 用户注册流程管理路由 - MarketBook 平台
 * 新增功能：注册进度跟踪、用户引导、分步注册
 * 
 * @version 1.0.0
 * @author MarketBook Team
 */

const express = require('express');
const UserRegistrationFlow = require('../models/UserRegistrationFlow');
const { validateRegistrationStep } = require('../middleware/validation');

const router = express.Router();

/**
 * 开始注册流程
 */
router.post('/start', async (req, res) => {
    try {
        const { email, referralCode } = req.body;
        
        const registrationFlow = new UserRegistrationFlow({
            email,
            referralCode,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        
        const result = await registrationFlow.startRegistration();
        
        res.status(201).json({
            success: true,
            message: '注册流程已开始',
            registrationId: registrationFlow.id,
            currentStep: registrationFlow.currentStep,
            nextStep: registrationFlow.getNextStep(),
            estimatedTime: registrationFlow.getEstimatedCompletionTime(),
            data: result
        });
        
    } catch (error) {
        console.error('开始注册流程错误:', error);
        res.status(500).json({
            success: false,
            message: '注册流程启动失败',
            error: error.message
        });
    }
});

/**
 * 完成注册步骤
 */
router.post('/:registrationId/step/:stepName', validateRegistrationStep, async (req, res) => {
    try {
        const { registrationId, stepName } = req.params;
        const stepData = req.body;
        
        const registrationFlow = await UserRegistrationFlow.findById(registrationId);
        
        if (!registrationFlow) {
            return res.status(404).json({
                success: false,
                message: '注册流程不存在'
            });
        }
        
        const result = await registrationFlow.completeStep(stepName, stepData);
        
        res.json({
            success: true,
            message: `步骤 ${stepName} 完成`,
            currentStep: registrationFlow.currentStep,
            completedSteps: registrationFlow.completedSteps,
            progress: registrationFlow.getProgressPercentage(),
            nextStep: registrationFlow.getNextStep(),
            estimatedTime: registrationFlow.getEstimatedCompletionTime(),
            data: result
        });
        
    } catch (error) {
        console.error('完成注册步骤错误:', error);
        res.status(400).json({
            success: false,
            message: `步骤 ${req.params.stepName} 完成失败`,
            error: error.message
        });
    }
});

/**
 * 获取注册进度
 */
router.get('/:registrationId/progress', async (req, res) => {
    try {
        const { registrationId } = req.params;
        
        const registrationFlow = await UserRegistrationFlow.findById(registrationId);
        
        if (!registrationFlow) {
            return res.status(404).json({
                success: false,
                message: '注册流程不存在'
            });
        }
        
        const progress = registrationFlow.getProgressReport();
        
        res.json({
            success: true,
            progress: progress
        });
        
    } catch (error) {
        console.error('获取注册进度错误:', error);
        res.status(500).json({
            success: false,
            message: '获取注册进度失败',
            error: error.message
        });
    }
});

/**
 * 完成注册并创建用户
 */
router.post('/:registrationId/complete', async (req, res) => {
    try {
        const { registrationId } = req.params;
        
        const registrationFlow = await UserRegistrationFlow.findById(registrationId);
        
        if (!registrationFlow) {
            return res.status(404).json({
                success: false,
                message: '注册流程不存在'
            });
        }
        
        const result = await registrationFlow.completeRegistration();
        
        res.json({
            success: true,
            message: '注册完成',
            user: result.user.getSafeInfo(),
            onboardingTasks: result.onboardingTasks,
            welcomeMessage: result.welcomeMessage,
            nextSteps: result.nextSteps
        });
        
    } catch (error) {
        console.error('完成注册错误:', error);
        res.status(400).json({
            success: false,
            message: '注册完成失败',
            error: error.message
        });
    }
});

/**
 * 获取用户引导任务
 */
router.get('/:registrationId/onboarding', async (req, res) => {
    try {
        const { registrationId } = req.params;
        
        const registrationFlow = await UserRegistrationFlow.findById(registrationId);
        
        if (!registrationFlow) {
            return res.status(404).json({
                success: false,
                message: '注册流程不存在'
            });
        }
        
        const onboardingTasks = registrationFlow.getOnboardingTasks();
        
        res.json({
            success: true,
            onboardingTasks: onboardingTasks
        });
        
    } catch (error) {
        console.error('获取引导任务错误:', error);
        res.status(500).json({
            success: false,
            message: '获取引导任务失败',
            error: error.message
        });
    }
});

/**
 * 完成引导任务
 */
router.post('/:registrationId/onboarding/:taskId/complete', async (req, res) => {
    try {
        const { registrationId, taskId } = req.params;
        
        const registrationFlow = await UserRegistrationFlow.findById(registrationId);
        
        if (!registrationFlow) {
            return res.status(404).json({
                success: false,
                message: '注册流程不存在'
            });
        }
        
        const result = await registrationFlow.completeOnboardingTask(taskId, req.body);
        
        res.json({
            success: true,
            message: `引导任务 ${taskId} 完成`,
            completedTasks: result.completedTasks,
            remainingTasks: result.remainingTasks,
            progress: result.progress,
            reward: result.reward
        });
        
    } catch (error) {
        console.error('完成引导任务错误:', error);
        res.status(400).json({
            success: false,
            message: `引导任务 ${req.params.taskId} 完成失败`,
            error: error.message
        });
    }
});

module.exports = router;