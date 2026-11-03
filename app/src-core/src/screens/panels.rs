//! Editable owned Help panels and dialogs with bounded dismissal behavior.

use super::*;

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct HelpStarter {
    pub title: String,
    pub explanation: String,
    pub asset_id: String,
    pub expected_asset_sha256: String,
    pub width: u32,
    pub height: u32,
}

impl AuthoringService {
    /// Prepare ordinary editable source without accepting a screen or a history entry.
    /// The existing screen-create operation owns the marker, metadata and atomic write.
    pub fn prepare_help_panel(
        &self,
        project: &ProjectId,
        project_id: &str,
        name: &str,
        starter: HelpStarter,
    ) -> Result<Vec<u8>, SceneError> {
        self.prepare_help(project, project_id, name, starter, false)
    }

    /// Prepare a blocking Help starter. Creation owns acceptance and history.
    pub fn prepare_help_dialog(
        &self,
        project: &ProjectId,
        project_id: &str,
        name: &str,
        starter: HelpStarter,
    ) -> Result<Vec<u8>, SceneError> {
        self.prepare_help(project, project_id, name, starter, true)
    }

    fn prepare_help(
        &self,
        project: &ProjectId,
        project_id: &str,
        name: &str,
        starter: HelpStarter,
        dialog: bool,
    ) -> Result<Vec<u8>, SceneError> {
        if !valid_name(name)
            || starter.width == 0
            || starter.height == 0
            || starter.width > MAX_PIXELS
            || starter.height > MAX_PIXELS
        {
            return Err(SceneError::InvalidPayload);
        }
        let title = composition::text_literal(&starter.title)?;
        let explanation = composition::text_literal(&starter.explanation)?;
        let image = self.prepare_ui_image_reference(
            project,
            project_id,
            &starter.asset_id,
            &starter.expected_asset_sha256,
            None,
        )?;
        let image_path =
            serde_json::to_string(&image.path).map_err(|_| SceneError::ImageInvalid)?;
        let target = serde_json::to_string(name).map_err(|_| SceneError::InvalidPayload)?;
        let modal = if dialog { "True" } else { "False" };
        let dismissal = if dialog {
            "Return()".to_owned()
        } else {
            format!("Hide({target})")
        };
        let [frame, column, content, heading, body, image, close] =
            std::array::from_fn(|_| uuid::Uuid::new_v4().to_string());
        let width = starter.width;
        let height = starter.height;
        Ok(format!(
            r#"screen {name}():
    modal {modal}
    key "game_menu" action {dismissal}
    frame: # loomlight-element: {frame}
        xalign 0.5
        yalign 0.5
        vbox: # loomlight-element: {column}
            vbox: # loomlight-element: {content}
                text {title} # loomlight-element: {heading}
                text {explanation} # loomlight-element: {body}
                add {image_path}: # loomlight-element: {image}
                    xsize {width}
                    ysize {height}
            textbutton "Close": # loomlight-element: {close}
                action {dismissal}
                default_focus True
"#,
        )
        .into_bytes())
    }
}

#[cfg(test)]
#[path = "panel_tests.rs"]
mod tests;
