import { useAmplitude } from "@/providers/AmplitudeProvider";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { Identify } from "@amplitude/analytics-browser";

export const useAmplitudeEvents = () => {
  const { amplitude } = useAmplitude();
  const { user } = useTaskMasterStore();

  const getBaseProperties = () => ({
    rez_task_master_email_address: user?.emailAddress,
    rez_task_master_id: user?.id,
  });

  const logEvent = (
    eventName: string,
    properties?: Record<string, unknown>
  ) => {
    if (!amplitude) {
      console.warn("Amplitude not initialized");
      return;
    }

    let eventProperties = {};

    if (eventName === "sign_in_with_google_complete") {
      eventProperties = {
        ...getBaseProperties(),
        ...properties,
      };
    } else {
      eventProperties = {
        ...properties,
      };
    }

    amplitude.track(eventName, eventProperties);
  };

  return {
    setTaskMasterId: (taskMasterId: string) => {
      amplitude?.setUserId(taskMasterId);
    },

    identifyTaskMaster: (properties?: Record<string, string | number | boolean | string[] | number[]>) => {
      if (!user) {
        return;
      }

      const identify = new Identify();

      for (const [key, value] of Object.entries(properties || {})) {
        if (value !== undefined) {
          identify.set(key, value);
        }
      }

      amplitude?.identify(identify);
    },

    // ==========================================
    // AUTHENTICATION EVENTS
    // ==========================================
    signInWithGoogleClicked: (properties?: Record<string, unknown>) => {
      logEvent("sign_in_with_google_clicked", {
        ...properties,
      });
    },

    signInWithGoogleComplete: (properties?: Record<string, unknown>) => {
      logEvent("sign_in_with_google_complete", {
        ...properties,
      });
    },

    signInWithGoogleFailed: (properties?: Record<string, unknown>) => {
      logEvent("sign_in_with_google_failed", {
        ...properties,
      });
    },

    signOutClicked: (properties?: Record<string, unknown>) => {
      logEvent("sign_out_clicked", {
        ...properties,
      });
    },

    signOutComplete: (properties?: Record<string, unknown>) => {
      logEvent("sign_out_complete", {
        ...properties,
      });
    },

    signOutFailed: (properties?: Record<string, unknown>) => {
      logEvent("sign_out_failed", {
        ...properties,
      });
    },

    // ==========================================
    // ONBOARDING EVENTS
    // ==========================================
    organizationOnboardingClicked: (properties?: Record<string, unknown>) => {
      logEvent("organization_onboarding_clicked", properties);
    },

    organizationOnboardingComplete: (properties?: Record<string, unknown>) => {
      logEvent("organization_onboarding_complete", properties);
    },

    organizationOnboardingFailed: (properties?: Record<string, unknown>) => {
      logEvent("organization_onboarding_failed", properties);
    },

    // ==========================================
    // NAVIGATION EVENTS
    // ==========================================
    dashboardClicked: (properties?: Record<string, unknown>) => {
      logEvent("dashboard_clicked", properties);
    },

    tasksClicked: (properties?: Record<string, unknown>) => {
      logEvent("tasks_clicked", properties);
    },

    analyticsClicked: (properties?: Record<string, unknown>) => {
      logEvent("analytics_clicked", properties);
    },

    resourcesClicked: (properties?: Record<string, unknown>) => {
      logEvent("resources_clicked", properties);
    },

    accountSettingsClicked: (properties?: Record<string, unknown>) => {
      logEvent("account_settings_clicked", properties);
    },

    sidebarCreateTaskClicked: (properties?: Record<string, unknown>) => {
      logEvent("sidebar_create_task_clicked", properties);
    },

    adminDashboardClicked: (properties?: Record<string, unknown>) => {
      logEvent("admin_dashboard_clicked", properties);
    },

    // ==========================================
    // PAGE VIEW EVENTS
    // ==========================================
    accountPageViewed: (properties?: Record<string, unknown>) => {
      logEvent("account_page_viewed", properties);
    },

    aboutPageViewed: (properties?: Record<string, unknown>) => {
      logEvent("about_page_viewed", properties);
    },

    termsOfServiceViewed: (properties?: Record<string, unknown>) => {
      logEvent("terms_of_service_viewed", properties);
    },

    privacyPolicyViewed: (properties?: Record<string, unknown>) => {
      logEvent("privacy_policy_viewed", properties);
    },

    // ==========================================
    // TASK CREATION EVENTS
    // ==========================================
    createNewTaskTabClicked: (properties?: Record<string, unknown>) => {
      logEvent("create_new_task_tab_clicked", properties);
    },

    createNewTaskClicked: (properties?: Record<string, unknown>) => {
      logEvent("create_new_task_clicked", properties);
    },

    createNewTaskComplete: (properties?: Record<string, unknown>) => {
      logEvent("create_new_task_complete", properties);
    },

    createNewTaskFailed: (properties?: Record<string, unknown>) => {
      logEvent("create_new_task_failed", properties);
    },

    viewTasksTabClicked: (properties?: Record<string, unknown>) => {
      logEvent("view_tasks_tab_clicked", properties);
    },

    // Task Creation Flow Step Events
    taskCreationStep1Completed: (properties?: Record<string, unknown>) => {
      logEvent("task_creation_step_1_completed", properties);
    },

    taskCreationStep2Completed: (properties?: Record<string, unknown>) => {
      logEvent("task_creation_step_2_completed", properties);
    },

    taskCreationStep3Completed: (properties?: Record<string, unknown>) => {
      logEvent("task_creation_step_3_completed", properties);
    },

    taskCreationStepBackClicked: (properties?: Record<string, unknown>) => {
      logEvent("task_creation_step_back_clicked", properties);
    },

    // ==========================================
    // TASK MASTER TASK EDITING EVENTS
    // ==========================================
    taskEditClicked: (properties?: Record<string, unknown>) => {
      logEvent("task_edit_clicked", properties);
    },

    taskEditComplete: (properties?: Record<string, unknown>) => {
      logEvent("task_edit_complete", properties);
    },

    taskEditFailed: (properties?: Record<string, unknown>) => {
      logEvent("task_edit_failed", properties);
    },

    taskEditCancelled: (properties?: Record<string, unknown>) => {
      logEvent("task_edit_cancelled", properties);
    },

    // ==========================================
    // REFRESH EVENTS
    // ==========================================
    refreshClicked: (properties?: Record<string, unknown>) => {
      logEvent("refresh_clicked", properties);
    },

    // ==========================================
    // ADMIN TASK MANAGEMENT EVENTS
    // ==========================================
    adminTasksPageViewed: (properties?: Record<string, unknown>) => {
      logEvent("admin_tasks_page_viewed", properties);
    },

    adminTaskViewDetailsClicked: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_view_details_clicked", properties);
    },

    adminTaskEditClicked: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_edit_clicked", properties);
    },

    adminTaskEditComplete: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_edit_complete", properties);
    },

    adminTaskEditFailed: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_edit_failed", properties);
    },

    adminTaskEditCancelled: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_edit_cancelled", properties);
    },

    adminTaskActivateClicked: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_activate_clicked", properties);
    },

    adminTaskActivateComplete: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_activate_complete", properties);
    },

    adminTaskActivateFailed: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_activate_failed", properties);
    },

    adminTaskDeactivateClicked: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_deactivate_clicked", properties);
    },

    adminTaskDeactivateComplete: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_deactivate_complete", properties);
    },

    adminTaskDeactivateFailed: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_deactivate_failed", properties);
    },

    adminTaskDeleteClicked: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_delete_clicked", properties);
    },

    adminTaskDeleteComplete: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_delete_complete", properties);
    },

    adminTaskDeleteFailed: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_delete_failed", properties);
    },

    adminTaskDeleteCancelled: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_delete_cancelled", properties);
    },

    adminTasksRefreshClicked: (properties?: Record<string, unknown>) => {
      logEvent("admin_tasks_refresh_clicked", properties);
    },

    adminTasksSearchPerformed: (properties?: Record<string, unknown>) => {
      logEvent("admin_tasks_search_performed", properties);
    },

    // ==========================================
    // ADMIN TASK MASTER MANAGEMENT EVENTS
    // ==========================================
    adminTaskMastersPageViewed: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_masters_page_viewed", properties);
    },

    adminTaskMasterEditClicked: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_master_edit_clicked", properties);
    },

    adminTaskMasterEditComplete: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_master_edit_complete", properties);
    },

    adminTaskMasterEditFailed: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_master_edit_failed", properties);
    },

    adminTaskMasterEditCancelled: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_master_edit_cancelled", properties);
    },

    adminTaskMasterDisableClicked: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_master_disable_clicked", properties);
    },

    adminTaskMasterDisableComplete: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_master_disable_complete", properties);
    },

    adminTaskMasterDisableFailed: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_master_disable_failed", properties);
    },

    adminTaskMasterEnableClicked: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_master_enable_clicked", properties);
    },

    adminTaskMasterEnableComplete: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_master_enable_complete", properties);
    },

    adminTaskMasterEnableFailed: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_master_enable_failed", properties);
    },

    adminTaskMasterSuperAdminGranted: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_master_super_admin_granted", properties);
    },

    adminTaskMasterSuperAdminRevoked: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_master_super_admin_revoked", properties);
    },

    adminTaskMastersRefreshClicked: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_masters_refresh_clicked", properties);
    },

    adminTaskMastersSearchPerformed: (properties?: Record<string, unknown>) => {
      logEvent("admin_task_masters_search_performed", properties);
    },

    // ==========================================
    // CUSTOM EVENT
    // ==========================================
    logCustomEvent: (
      eventName: string,
      properties?: Record<string, unknown>
    ) => {
      logEvent(eventName, properties);
    },
  };
};
