import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./TorrentItem.css";
import {
  Torrent,
  TorrentState,
  fetchTorrentFilesAsync,
  selectTorrentFiles,
} from "./torrentsSlice";

import { LinearProgress } from "@rmwc/linear-progress";
import "@rmwc/linear-progress/styles";

import { ListItem, ListItemMeta, CollapsibleList } from "@rmwc/list";
import "@rmwc/list/styles";

import { Icon } from "@rmwc/icon";
import "@rmwc/icon/styles";

import { Tooltip } from "@rmwc/tooltip";
import "@rmwc/tooltip/styles";

import { Typography } from "@rmwc/typography";
import "@rmwc/typography/styles";

import { ThemeProvider } from "@rmwc/theme";
import "@rmwc/theme/styles";

import { TorrentDetails } from "./TorrentDetails";
import { TorrentContextMenu } from "./TorrentActions";

import {
  ContextMenuWrapper,
  useContextMenuTrigger,
} from "react-context-menu-wrapper";

import prettyBytes from "pretty-bytes";
import humanizeDuration from "humanize-duration";

export interface TorrentItemProps {
  torrent: Torrent;
}

interface TorrentListItemProps {
  torrent: Torrent;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

const iconForTorrentState = (state: TorrentState): string => {
  switch (state) {
    case TorrentState.Checking:
      return "fact_check";

    case TorrentState.Completed:
      return "done";

    case TorrentState.Downloading:
    case TorrentState.Stalled:
    case TorrentState.FetchingMetadata:
      return "arrow_downward";

    case TorrentState.Seeding:
      return "arrow_upward";

    case TorrentState.Paused:
      return "pause";

    case TorrentState.Queued:
      return "schedule";

    case TorrentState.Error:
    case TorrentState.MissingFiles:
      return "error";

    case TorrentState.Moving:
      return "content_copy";

    default:
      return "";
  }
};

function TorrentListItem(props: TorrentListItemProps) {
  const error =
    props.torrent.state === TorrentState.Error ||
    props.torrent.state === TorrentState.MissingFiles ||
    props.torrent.state === TorrentState.Paused ||
    props.torrent.state === TorrentState.Unknown;

  const completed =
    props.torrent.state === TorrentState.Completed ||
    props.torrent.bytesDownloaded >= props.torrent.size;

  const contextMenuId = `server-dashboard-torrent-context-menu-${props.torrent.hash}`;
  const itemRef = useContextMenuTrigger({
    menuId: contextMenuId,
  });

  return (
    <>
      <ListItem
        ref={itemRef}
        key={props.torrent.hash}
        onClick={props.onClick}
        style={{ height: "85px" }}
      >
        <ThemeProvider
          options={
            error
              ? {
                  primary: "#b00020",
                }
              : completed
              ? {
                  primary: "#00c853",
                  textPrimaryOnBackground: "#00c853",
                  textSecondaryOnBackground: "#00c853",
                }
              : {}
          }
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography
              use="subtitle1"
              theme={error ? "error" : "textPrimaryOnBackground"}
              style={{
                display: "flex",
                alignItems: "center",
                margin: "5px 5px 0px 5px",
              }}
            >
              <Typography
                use="body1"
                theme="textSecondaryOnBackground"
                style={{ paddingRight: "8px" }}
              >
                {completed ? "" : `#${props.torrent.priority}`}
              </Typography>
              <Icon
                icon={iconForTorrentState(props.torrent.state)}
                style={{ paddingRight: "10px" }}
              />
              {props.torrent.name}
            </Typography>

            <Typography
              use="body1"
              theme={error ? "error" : "textSecondaryOnBackground"}
              style={{
                margin: "5px 5px 0px 5px",
                color: error ? "#c62828" : "",
              }}
            >
              {(props.torrent.forceStart ? "[F] " : "") +
                TorrentState[props.torrent.state]
                  .replace(/([A-Z])/g, " $1")
                  .trim()}
            </Typography>
          </div>

          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            <Tooltip
              className="server-dashboard-torrent-data-tooltip"
              content="Progress"
            >
              <div className="server-dashboard-torrent-data">
                <Icon icon="cached" />
                <Typography use="body2" style={{ marginLeft: "5px" }}>
                  {(props.torrent.progress * 100).toFixed(2)}%
                </Typography>
              </div>
            </Tooltip>

            <Tooltip
              className="server-dashboard-torrent-data-tooltip"
              content="Size"
            >
              <div className="server-dashboard-torrent-data">
                <Icon icon="content_copy" />
                <Typography use="body2" style={{ marginLeft: "5px" }}>
                  {prettyBytes(props.torrent.size)}
                </Typography>
              </div>
            </Tooltip>

            <Tooltip
              className="server-dashboard-torrent-data-tooltip"
              content="Download Speed"
            >
              <div className="server-dashboard-torrent-data">
                <Icon icon="arrow_downward" style={{ color: "#00e676" }} />
                <Typography use="body2" style={{ marginLeft: "5px" }}>
                  {prettyBytes(props.torrent.downloadSpeed)}/s
                  {props.torrent.downloadLimit > 0
                    ? ` (Limit: ${prettyBytes(props.torrent.downloadLimit)}/s)`
                    : ""}
                </Typography>
              </div>
            </Tooltip>

            <Tooltip
              className="server-dashboard-torrent-data-tooltip"
              content="Upload Speed"
            >
              <div className="server-dashboard-torrent-data">
                <Icon icon="arrow_upward" style={{ color: "#00b0ff" }} />
                <Typography use="body2" style={{ marginLeft: "5px" }}>
                  {prettyBytes(props.torrent.uploadSpeed)}/s
                  {props.torrent.uploadLimit > 0
                    ? ` (Limit: ${prettyBytes(props.torrent.uploadLimit)}/s)`
                    : ""}
                </Typography>
              </div>
            </Tooltip>

            <Tooltip
              className="server-dashboard-torrent-data-tooltip"
              content="Peers"
            >
              <div className="server-dashboard-torrent-data">
                <Icon icon="people" />
                <Typography use="body2" style={{ marginLeft: "5px" }}>
                  {`${props.torrent.peers} (${props.torrent.totalPeers})`}
                </Typography>
              </div>
            </Tooltip>

            <Tooltip
              className="server-dashboard-torrent-data-tooltip"
              content="ETA"
            >
              <div className="server-dashboard-torrent-data">
                <Icon icon="schedule" />
                <Typography use="body2" style={{ marginLeft: "5px" }}>
                  {props.torrent.state === TorrentState.Downloading
                    ? humanizeDuration(props.torrent.eta * 1000, {
                        round: true,
                        largest: 2,
                      })
                    : completed
                    ? "Completed"
                    : "No ETA"}
                </Typography>
              </div>
            </Tooltip>

            <ListItemMeta icon="chevron_right" />
          </div>
          <div style={{ width: "100%" }}>
            <LinearProgress
              progress={props.torrent.progress}
              buffer={1}
              style={{ width: "100%", margin: "8px" }}
            />
          </div>
        </ThemeProvider>
      </ListItem>

      <ContextMenuWrapper id={contextMenuId}>
        <TorrentContextMenu torrent={props.torrent} />
      </ContextMenuWrapper>
    </>
  );
}

export function TorrentItem(props: TorrentItemProps) {
  const [open, setOpen] = useState(false);
  const collapsibleRef = useRef<CollapsibleList>(null);

  const torrentFiles = useSelector(selectTorrentFiles(props.torrent.hash));

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchTorrentFilesAsync(props.torrent.hash));
  }, [dispatch, props.torrent.hash]);

  useEffect(() => {
    if (open) {
      dispatch(fetchTorrentFilesAsync(props.torrent.hash));

      const interval = setInterval(
        () => dispatch(fetchTorrentFilesAsync(props.torrent.hash)),
        1100
      );
      return () => clearInterval(interval);
    }
  }, [dispatch, open, props.torrent.hash]);

  return (
    <CollapsibleList
      ref={collapsibleRef as React.MutableRefObject<null>}
      key={props.torrent.hash}
      handle={
        <TorrentListItem
          torrent={props.torrent}
          onClick={() => setOpen(!open)}
        />
      }
      open={open}
    >
      <TorrentDetails
        torrent={props.torrent}
        torrentFiles={torrentFiles}
        hidden={
          open
            ? false
            : collapsibleRef.current && collapsibleRef.current.root
            ? collapsibleRef.current.root.offsetHeight <= 85
            : true
        }
      />
    </CollapsibleList>
  );
}
