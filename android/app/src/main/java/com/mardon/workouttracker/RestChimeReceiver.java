package com.mardon.workouttracker;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

/**
 * Plays the rest-over chime when the alarm set by {@link RestChimePlugin}
 * fires. The rest timer itself is JS, which the WebView pauses once the screen
 * locks, so the end of rest is handed to AlarmManager up front instead.
 *
 * The chime goes out on the media stream (so it follows the active output —
 * earbuds when connected — and isn't muted by silent mode) and briefly ducks
 * whatever music is playing. No notification is posted.
 */
public class RestChimeReceiver extends BroadcastReceiver {
    private static final String TAG = "RestChime";
    private static final String EXTRA_HEADPHONES_ONLY = "headphonesOnly";
    /** Generous cap so the broadcast always finishes even if playback stalls. */
    private static final long PLAYBACK_TIMEOUT_MS = 5000;

    /** Arms the chime for {@code atMillis}, replacing any earlier one. */
    static void schedule(Context context, long atMillis, boolean headphonesOnly) {
        Intent intent = new Intent(context, RestChimeReceiver.class)
                .putExtra(EXTRA_HEADPHONES_ONLY, headphonesOnly);
        PendingIntent pending = PendingIntent.getBroadcast(
                context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        AlarmManager alarms = context.getSystemService(AlarmManager.class);
        // USE_EXACT_ALARM (API 33+) / SCHEDULE_EXACT_ALARM (31–32) normally make
        // exact alarms available; fall back to a slightly late chime otherwise.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()) {
            alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pending);
        } else {
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pending);
        }
    }

    static void cancel(Context context) {
        Intent intent = new Intent(context, RestChimeReceiver.class);
        PendingIntent pending = PendingIntent.getBroadcast(
                context, 0, intent, PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pending == null) return;
        context.getSystemService(AlarmManager.class).cancel(pending);
        pending.cancel();
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        AudioManager audio = context.getSystemService(AudioManager.class);
        boolean headphonesOnly = intent.getBooleanExtra(EXTRA_HEADPHONES_ONLY, true);
        if (headphonesOnly && !headphonesConnected(audio)) {
            Log.i(TAG, "Rest over; no headphones connected, staying silent");
            return;
        }
        Log.i(TAG, "Rest over; playing chime");
        play(context.getApplicationContext(), audio, goAsync());
    }

    private static boolean headphonesConnected(AudioManager audio) {
        for (AudioDeviceInfo device : audio.getDevices(AudioManager.GET_DEVICES_OUTPUTS)) {
            switch (device.getType()) {
                case AudioDeviceInfo.TYPE_WIRED_HEADSET:
                case AudioDeviceInfo.TYPE_WIRED_HEADPHONES:
                case AudioDeviceInfo.TYPE_USB_HEADSET:
                case AudioDeviceInfo.TYPE_BLUETOOTH_A2DP:
                case AudioDeviceInfo.TYPE_BLE_HEADSET:
                case AudioDeviceInfo.TYPE_HEARING_AID:
                    return true;
                default:
                    break;
            }
        }
        return false;
    }

    private static void play(Context context, AudioManager audio, PendingResult result) {
        AudioAttributes attributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
        MediaPlayer player = MediaPlayer.create(
                context, R.raw.rest_chime, attributes, audio.generateAudioSessionId());
        if (player == null) {
            Log.w(TAG, "Could not load the chime");
            result.finish();
            return;
        }

        // Ask music players to dip their volume (not pause) while it plays.
        AudioFocusRequest focus = null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focus = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                    .setAudioAttributes(attributes)
                    .build();
            audio.requestAudioFocus(focus);
        } else {
            audio.requestAudioFocus(null, AudioManager.STREAM_MUSIC,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
        }

        Handler handler = new Handler(Looper.getMainLooper());
        AudioFocusRequest heldFocus = focus;
        Runnable finish = new Runnable() {
            private boolean done;

            @Override
            public void run() {
                if (done) return;
                done = true;
                handler.removeCallbacks(this);
                player.release();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    audio.abandonAudioFocusRequest(heldFocus);
                } else {
                    audio.abandonAudioFocus(null);
                }
                result.finish();
            }
        };
        player.setOnCompletionListener(mp -> finish.run());
        player.setOnErrorListener((mp, what, extra) -> {
            Log.w(TAG, "Chime playback error " + what + "/" + extra);
            finish.run();
            return true;
        });
        handler.postDelayed(finish, PLAYBACK_TIMEOUT_MS);
        player.start();
    }
}
