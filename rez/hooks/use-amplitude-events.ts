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

    identifyTaskMaster: (properties?: Record<string, any>) => {
      if (!user) {
        return;
      }

      const identify = new Identify();

      for (const [key, value] of Object.entries(properties || {})) {
        identify.set(key, value);
      }

      amplitude?.identify(identify);
    },

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


    signOutClicked  : (properties?: Record<string, unknown>) => {
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

    organizationOnboardingClicked: (properties?: Record<string, unknown>) => {
      logEvent("organization_onboarding_clicked", properties);
    },

    organizationOnboardingComplete: (properties?: Record<string, unknown>) => {
      logEvent("organization_onboarding_complete", properties);
    },

    organizationOnboardingFailed: (properties?: Record<string, unknown>) => {
      logEvent("organization_onboarding_failed", properties);
    },

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

    // Task Management Events
    createNewTaskTabClicked: (properties?: Record<string, unknown>) => {
      logEvent("create_new_task_tab_clicked", properties);
    },

    // Task Management Events
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

    // Refresh Events
    refreshClicked: (properties?: Record<string, unknown>) => {
      logEvent("refresh_clicked", properties);
    },

    logCustomEvent: (
      eventName: string,
      properties?: Record<string, unknown>
    ) => {
      logEvent(eventName, properties);
    },
  };
};
