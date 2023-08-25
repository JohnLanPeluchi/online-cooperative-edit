import React, { ChangeEvent, useContext } from "react";
import { Modal, Input } from "antd";
import { WebContainer } from "@webcontainer/api";

import { useAppDispatch, useAppSelector } from "@/store";
import {
  changeFileModalStatus,
  changeFormatPathValue,
} from "@/store/modules/code";
import { ActionTypeEnumMap, ActionTypeEnum } from "@/types";
import { getNodePath } from "@/utils/file";
import {
  renameFile,
  rm,
  readFileSystem,
  createDir,
  createFile,
  saveFileSystemTree,
} from "@/utils/webContainer";
import useMemoSelectedNode from "@/hooks/useMemoSelectedNode";
import TreeDataContext, { treeDataContextType } from "@/context/tree-data";
import WebContainerContext from "@/context/webContainer";

const FileEditorModal: React.FC = () => {
  const { fileModalIsOpen, fileControlType, formatPath, selectedKey } =
    useAppSelector(state => state.code);

  const { treeData, setTreeData } = useContext(
    TreeDataContext,
  ) as treeDataContextType;
  const webcontainerInstance = useContext(WebContainerContext) as WebContainer;

  const dispatch = useAppDispatch();

  const selectedNode = useMemoSelectedNode(treeData);

  // 保存文件
  const syncFileSystemToUI = async () => {
    const result = await readFileSystem(webcontainerInstance);

    setTreeData(result);

    saveFileSystemTree(webcontainerInstance);
  };

  const handleOk = async () => {
    const path = getNodePath(selectedKey, treeData);

    if (fileControlType === ActionTypeEnum.Rename) {
      renameFile(path, formatPath, webcontainerInstance);

      selectedNode!.title = formatPath;

      setTreeData(pre => [...pre]);
    }

    if (fileControlType === ActionTypeEnum.Del) {
      setTreeData(pre => pre.filter(item => item.key !== selectedKey));

      await rm(path, webcontainerInstance);

      syncFileSystemToUI();
    }

    if (fileControlType === ActionTypeEnum.Create_Root_Dir) {
      createDir(formatPath, webcontainerInstance);
      syncFileSystemToUI();
    }

    if (fileControlType === ActionTypeEnum.Create_Root_File) {
      createFile(formatPath, webcontainerInstance);
      syncFileSystemToUI();
    }

    if (fileControlType === ActionTypeEnum.Create_File) {
      createFile(`${path}/${formatPath}`, webcontainerInstance);
      syncFileSystemToUI();
    }

    if (fileControlType === ActionTypeEnum.Create_Dir) {
      createDir(`${path}/${formatPath}`, webcontainerInstance);
      syncFileSystemToUI();
    }

    dispatch(changeFileModalStatus({ open: false }));
  };

  const handleCancel = () => {
    dispatch(changeFileModalStatus({ open: false }));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(changeFormatPathValue(event.target.value));
  };

  return (
    <>
      <Modal
        title={ActionTypeEnumMap.get(fileControlType as ActionTypeEnum)}
        open={fileModalIsOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        {fileControlType === ActionTypeEnum.Del ? (
          <div>{formatPath}</div>
        ) : (
          <Input
            placeholder="Basic usage"
            value={formatPath}
            onChange={handleInputChange}
            bordered={false}
          />
        )}
      </Modal>
    </>
  );
};

export default FileEditorModal;