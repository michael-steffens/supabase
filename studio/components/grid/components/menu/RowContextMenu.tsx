import { Menu, Item, ItemParams, PredicateParams } from 'react-contexify'
import { IconTrash, IconClipboard, IconEdit } from 'ui'
import { useDispatch, useTrackedState } from '../../store'
import { formatClipboardValue, copyToClipboard } from '../../utils'
import { useTableRowDeleteMutation } from 'data/table-rows/table-row-delete-mutation'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { SupaTable } from 'components/grid/types'

export const ROW_CONTEXT_MENU_ID = 'row-context-menu-id'

export type RowContextMenuProps = {
  table: SupaTable
}

const RowContextMenu = ({ table }: RowContextMenuProps) => {
  const state = useTrackedState()
  const dispatch = useDispatch()

  const { project } = useProjectContext()
  const { mutateAsync: deleteRows } = useTableRowDeleteMutation()

  function onDeleteRow(p: ItemParams) {
    confirmAlert({
      title: 'Confirm to delete',
      message: 'Are you sure you want to delete this row? This action cannot be undone.',
      onAsyncConfirm: async () => {
        const { props } = p
        const { rowIdx } = props
        const row = state.rows[rowIdx]
        if (!row || !project) return

        try {
          await deleteRows({
            projectRef: project.ref,
            connectionString: project.connectionString,
            table,
            rows: [row],
          })

          dispatch({ type: 'REMOVE_ROWS', payload: { rowIdxs: [row.idx] } })
          dispatch({
            type: 'SELECTED_ROWS_CHANGE',
            payload: { selectedRows: new Set() },
          })
        } catch (error) {
          if (state.onError) state.onError(error)
        }
      },
    })
  }

  function onEditRowClick(p: ItemParams) {
    const { props } = p
    const { rowIdx } = props
    const row = state.rows[rowIdx]
    if (state.onEditRow) state.onEditRow(row)
  }

  function isItemHidden({ data }: PredicateParams) {
    if (data === 'edit') return state.onEditRow == undefined
    if (data === 'delete') return !state.editable
    return false
  }

  function onCopyCellContent(p: ItemParams) {
    const { props } = p

    if (!state.selectedCellPosition || !props) {
      return
    }

    const { rowIdx } = props
    const row = state.rows[rowIdx]

    const columnKey = state.gridColumns[state.selectedCellPosition?.idx as number].key

    const value = row[columnKey]
    const text = formatClipboardValue(value)

    copyToClipboard(text)
  }

  return (
    <>
      <Menu
        id={ROW_CONTEXT_MENU_ID}
        animation={false}
        className="!bg-scale-300 border border-scale-500"
      >
        <Item onClick={onCopyCellContent}>
          <IconClipboard size="tiny" />
          <span className="ml-2 text-xs">Copy cell content</span>
        </Item>
        <Item onClick={onEditRowClick} hidden={isItemHidden} data="edit">
          <IconEdit size="tiny" />
          <span className="ml-2 text-xs">Edit row</span>
        </Item>
        <Item onClick={onDeleteRow} hidden={isItemHidden} data="delete">
          <IconTrash size="tiny" stroke="red" />
          <span className="ml-2 text-xs">Delete row</span>
        </Item>
      </Menu>
    </>
  )
}
export default RowContextMenu
