import { useApi } from "../hooks/useApi";
import { Heading, Status, Empty, Field } from "../components/UI";
import ActionForm from "../components/ActionForm";
import s from "./Settings.module.css";
export default function Settings() {
  const me = useApi("/me"),
    kyc = useApi("/kyc"),
    notifications = useApi("/notify/notification");
  return (
    <>
      <Heading eyebrow="MAKE YOURSELF AT HOME" title="Account settings.">
        Your profile, security, and identity verification.
      </Heading>
      <div className={s.grid}>
        <section className={s.panel}>
          <h3>Personal details</h3>
          <Status {...me} retry={me.reload} variant="panel" skeletonCount={1} />
          {me.data && (
            <dl>
              {[
                ["Full name", me.data.user.full_name],
                ["Username", me.data.user.username],
                ["Email", me.data.user.email],
                ["Phone", me.data.user.phone],
                ["Country", me.data.user.country],
                ["Account type", me.data.user.account_type],
                ["Account status", me.data.user.account_status],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "—"}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className={s.note}>
            Contact your platform administrator to update personal details.
          </p>
        </section>
        <section className={s.panel}>
          <h3>Change password</h3>
          <p className={s.note}>
            Choose a unique password with at least eight characters.
          </p>
          <ActionForm
            endpoint="/change-password"
            method="patch"
            label="Update password"
          >
            <Field
              label="New password"
              name="new_password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
            <Field
              label="Confirm new password"
              name="confirm_password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              onInput={(e) =>
                e.target.setCustomValidity(
                  e.target.value !== e.target.form.elements.new_password.value
                    ? "Passwords must match."
                    : "",
                )
              }
            />
          </ActionForm>
        </section>
        <section className={s.panel}>
          <h3>Identity verification</h3>
          <Status {...kyc} retry={kyc.reload} variant="panel" skeletonCount={1} />
          {kyc.data && (
            <p className={s.verification}>
              Verification status:{" "}
              <strong>{kyc.data.kyc?.status || "Not submitted"}</strong>
            </p>
          )}
          <p className={s.note}>
            Upload a clear selfie and both sides of your identity document. JPG,
            PNG, or WEBP; up to 5 MB per file.
          </p>
          <ActionForm
            endpoint="/kyc/submit"
            multipart
            label="Submit documents for review"
            onSuccess={kyc.reload}
          >
            {[
              ["Selfie", "selfie"],
              ["Identity document — front", "id_front"],
              ["Identity document — back", "id_back"],
            ].map(([label, name]) => (
              <Field
                key={name}
                label={label}
                name={name}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={(e) =>
                  e.target.setCustomValidity(
                    e.target.files[0]?.size > 5 * 1024 * 1024
                      ? "Each file must be 5 MB or smaller."
                      : "",
                  )
                }
              />
            ))}
          </ActionForm>
        </section>
        <section className={s.panel}>
          <h3>Account notifications</h3>
          <Status {...notifications} retry={notifications.reload} variant="panel" skeletonCount={1} />
          {notifications.data &&
            (notifications.data.notifications.length ? (
              notifications.data.notifications.map((n) => (
                <article className={s.notification} key={n.id}>
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                  <small>{new Date(n.created_at).toLocaleString()}</small>
                </article>
              ))
            ) : (
              <Empty>
                You’re all caught up. Account updates will appear here.
              </Empty>
            ))}
        </section>
      </div>
    </>
  );
}
